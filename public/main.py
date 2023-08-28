import numpy as np
import pandas as pd
import scipy as sc
from sklearn.model_selection import train_test_split 
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_score
import statsmodels.api as sm
import json
from js import calculate_capm, structure_simple_model_data, structure_data, console, document
from pyodide.ffi.wrappers import add_event_listener
import pyodide
# Capm
# The Formula for CAPM: Expected Return = (Beta * (Return of the Market - Risk Free Rate)) + Risk free rate
"""
- Beta can be interpretated as the level of the asset return's sensitivity as compared to the market in general
- Beta <= -1: The asset moves in the opposite direction as the benchmark and in greater amount than the negative benchmark
- -1 < Beta < 0: The asset moves in the opposite direction as the benchmark
- Beta = 0: There is no correlation between the asset and the market benchmark
- 0 < Beta < 1: The asset moves in the same direction as the market but the amount is smaller.
- Beta = 1: The asset and the market are moving in the same direction by the same amount
- Beta > 1: The asset moves in the same direction as the market but in greater amount
"""

async def company_data(*args):
    data = await structure_data()
    # console.log(data)
    [companies, benchmark, risk_free, beta_data] = data
    companies = json.loads(companies)
    benchmark = json.loads(benchmark)
    risk_free_rate = json.loads(risk_free)
    beta_values = json.loads(beta_data)
    company_tickers = list(companies.keys())
    benchmark_ticker = list(benchmark.keys())
    
    benchmark_symbol = benchmark_ticker[0]
    avg_return_arr = []
    market_return_arr = []
    for symbol in company_tickers:
        # print(companies[symbol])
        stock_price_data = companies[symbol]
        stock_price_df = pd.DataFrame(stock_price_data)
        stock_price_df = stock_price_df.set_index(['date'])
        X = stock_price_df['adjClose'].pct_change().mean() * 252
        # avg_return_arr.append({symbol: X})
        for industry_avg in benchmark_ticker:
            benchmark_data = benchmark[industry_avg]
            benchmark_df = pd.DataFrame(benchmark_data)
            benchmark_df = benchmark_df.set_index(['date'])
            Y = benchmark_df['close'].pct_change().mean() * 252
            market_return_arr.append({industry_avg: Y})
            avg_return_arr.append({symbol: X, industry_avg: Y})
    for obj in avg_return_arr:
        for obj_key, obj_val in obj.items():
            if obj_key in beta_values:
                new_p = js.document.createElement("p")
                # The Formula for CAPM: Expected Return = (Beta * (Return of the Market - Risk Free Rate)) + Risk free rate
                new_p.innerHTML = f"Ticker symbol: {obj_key} <br> Average rate of return(annual): {round(obj_val * 100, 2)}% <br> Stock beta: {round(beta_values[obj_key], 2)} <br> CAPM: {round(float((beta_values[obj_key]) * ((float(market_return_arr[0][benchmark_symbol]) * 100)) - risk_free_rate[0]['close']) + risk_free_rate[0]['close'], 2)}%"
                div_to_insert = js.document.querySelector('#div-to-insert')
                div_to_insert.appendChild(new_p)
                
                
                
"""
Linear Regression
- Predicting Stock Prices using a linear regression model
- Features: Volume and Open

async def simple_model_data(*args):
    model_data = await structure_simple_model_data()
    df_data = json.loads(model_data)
    df_data_keys = list(df_data.keys())
    model_dataframe = pd.DataFrame(df_data)
    model_dataframe = model_dataframe.set_index(['date'])
    X = model_dataframe[['volume', 'open']].values
    Y = model_dataframe['close']
    X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size = 0.2, random_state = 0)
    regressor = LinearRegression()
    regressor.fit(X_train, Y_train)
    y_pred = regressor.predict(X_test)
    
    print('Mean Absolute Error:', metrics.mean_absolute_error(Y_test, y_pred))  
    print('Mean Squared Error:', metrics.mean_squared_error(Y_test, y_pred))  
    print('Root Mean Squared Error:', np.sqrt(metrics.mean_squared_error(Y_test, y_pred)))

"""

async def simple_model_data(*args):
    model_data = await structure_simple_model_data()
    df_data = json.loads(model_data)
    model_DF = pd.DataFrame(df_data['data'])
    model_DF = model_DF.set_index(['date'])
    model_DF["Tomorrow"] = model_DF["adjClose"].shift(-1)
    model_DF["Target"] = (model_DF["Tomorrow"] > model_DF["adjClose"]).astype(int)
    
    model = RandomForestClassifier(n_estimators=250, min_samples_split=50, random_state=1)
    # X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size = 0.2, random_state = 0)
    predictors = ["adjClose", "volume", "open", "high", "low"]
    console.log(precision_score(predictions["Target"], predictions["Predictions"]))
    
    # Improving the model. Using moving averages
    horizons = [2, 5, 60, 250, 1000]
    new_predictors = []
    for horizon in horizons:
        rolling_averages = model_DF.rolling(horizon).mean()
        ratio_column = f"Close_Ratio_{horizon}"
        model_DF[ratio_column] = model_DF["adjClose"] / rolling_averages["adjClose"]
        trend_column = f"Trend_{horizon}"
        model_DF[trend_column] = model_DF.shift(1)
        new_predictors += [ratio_column, trend_column]
    model_DF = model_DF.dropna()
    predictions = backtest(model_DF, model, new_predictors)
    predictions["Predictions"].value_counts()
    console.log(precision_score(predictions["Target"], predictions["Predictions"]))
    
    
def predict(train, test, predictors, model):
    model.fit(train[predictors], train["Target"])
    preds = model.predict_proba(train[predictors])[:,1]
    preds[preds >= .6] = 1
    preds[preds < .6] = 0
    preds = pd.Series(preds, index=test.index, name="Predictions")
    return pd.concat([test["Target"], preds], axis=1)

def backtest(data, model, predictors, start=2500, step=250):
    all_predictions = []
    for i in range(start, data.shape[0], step):
        train = data.iloc[:i].copy()
        test = data.iloc[i:(i+step)].copy()
        predictions = predict(train, test, predictors, model)
        all_predictions.append(predictions)
    return pd.concat(all_predictions)





add_event_listener(document.getElementById("search-companies-btn"), "click", company_data)
add_event_listener(document.getElementById("create-simple-model"), "click", simple_model_data)
