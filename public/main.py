import numpy as np
import pyscript
import pandas as pd
import scipy as sc
import matplotlib.pyplot as plt
import scipy.optimize as sco
from sklearn.model_selection import train_test_split 
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_score
import statsmodels.api as sm
import json
from js import calculate_capm, structure_simple_model_data, structure_data, console, document, get_portfolio_data
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

global_model = None

def simple_predictions(model, inpts):
    try:
        return model.predict(inpts)
    except Exception as e:
       print(e)
     
async def simple_model_data(*args):
    try:
        global global_model
        model_dataframe = await structure_simple_model_data()
        global_model = create_simple_model(model_dataframe)
        return global_model
    except Exception as e:
        print(e)
       


def create_simple_model(model_dataframe):
    try:
        # sourcery skip: inline-immediately-returned-variable, use-assigned-variable
        df_data = json.loads(model_dataframe)
        model_DF = pd.DataFrame(df_data['data'])
        model_DF = model_DF.set_index(['date'])
        model_DF["Tomorrow"] = model_DF["adjClose"].shift(-1)
        model_DF["Target"] = (model_DF["Tomorrow"] > model_DF["adjClose"]).astype(int)
        model = RandomForestClassifier(n_estimators=250, min_samples_split=50, random_state=1)
        train = model_DF.iloc[:-100]
        test = model_DF.iloc[-100:]
        predictors = ["open", "high", "low", "adjClose", "volume"]
        model.fit(train[predictors], train["Target"])
        preds = model.predict(test[predictors])
        preds = pd.Series(preds, index=test.index)
        # print(precision_score(test["Target"], preds))
        model_accuracy = precision_score(test["Target"], preds)
        model_acc_txt = f"Your model is {round((model_accuracy * 100), 2)}% accurate"
        model_acc_p = js.document.createElement("p")
        model_acc_p.innerHTML = model_acc_txt
        model_acc_div = js.document.querySelector('#model-accuracy')
        model_acc_div.appendChild(model_acc_p)
        add_model_inpts()
        return model
    except Exception as e:
       print(e)
    

def add_model_inpts():
    try:
        open_pred = create_model_inpts('Open', 'prediction-open')
        high_pred = create_model_inpts('High', 'prediction-high')
        low_pred = create_model_inpts('Low', 'prediction-low')
        close_pred = create_model_inpts('Close', 'prediction-close')
        vol_pred = create_model_inpts('Volume', 'prediction-volume')
        pred_div = js.document.querySelector('#prediction-data')
        pred_div.appendChild(open_pred)
        pred_div.appendChild(high_pred)
        pred_div.appendChild(low_pred)
        pred_div.appendChild(close_pred)
        pred_div.appendChild(vol_pred)
        pred_btn = js.document.querySelector('#make-simple-pred-btn')
        pred_btn.style.display = "block"
    except Exception as e:
        print(e)

def create_model_inpts(attr, val):
    try:
        result = js.document.createElement("input")
        result.setAttribute('type', 'number')
        result.setAttribute('placeholder', attr)
        result.setAttribute('id', val)
        return result
    except Exception as e:
        print(e)
    
def get_prediction_vals():
    try:
        open_value = js.document.getElementById("prediction-open").value
        high_value = js.document.getElementById("prediction-high").value
        low_value = js.document.getElementById("prediction-low").value
        close_value = js.document.getElementById("prediction-close").value
        volume_value = js.document.getElementById("prediction-volume").value
        return pd.DataFrame(data=[[open_value, high_value, low_value, close_value, volume_value]], columns=["open", "high", "low", "adjClose", "volume"])
    except Exception as e:
        print(e)
def make_prediction(*args):  # sourcery skip: raise-specific-error
    try:
        global global_model
        inputs = get_prediction_vals()
        if global_model is None:
            raise Exception("Model is not created yet. Please create the model first.")
        predicted_values = simple_predictions(global_model, inputs)
        prediction_list = predicted_values.tolist()
        result = js.document.createElement("p")
        pred_div = js.document.querySelector('#prediction-verdict')
        if prediction_list[0] == 1:
            result.innerHTML = "The model's prediction/recommendation on this security is: Buy."
        else:
            result.innerHTML = "The model's prediction/recommendation on this security is: Don't Buy."
        pred_div.appendChild(result)
    except Exception as e:
        print(e)


# Portfolio Optimization section
async def portfolio_optimization(*args):
    # sourcery skip: for-append-to-extend, list-comprehension, remove-zero-from-range
    try:
        portfolio_data = await get_portfolio_data()
        portfolio_dict = json.loads(portfolio_data)
        company_symbols = list(portfolio_dict.keys())
        portfolio_asset_count = len(company_symbols)
        flattened_data = [dict(company = company, **values) for company, company_data in portfolio_dict.items() for values in company_data]
        # Create a DataFrame from the list of dictionaries
        portfolio_df = pd.DataFrame(flattened_data)
        portfolio_df['date'] = pd.to_datetime(portfolio_df['date'])
        portfolio_df.set_index(['date', 'company'], inplace=True)
        num_portfolios = 10 ** 5
        # Random weights
        np.random.seed(42)
        asset_weights = np.random.random(size=(num_portfolios, portfolio_asset_count))
        asset_weights /= np.sum(asset_weights, axis=1)[:, np.newaxis]
        adjusted_close = pd.DataFrame(portfolio_df['adjClose'])
        adjusted_close_df = adjusted_close.pivot_table(index='date', columns='company', values='adjClose')
        portfolio_logarithmic_returns = np.log(adjusted_close_df/adjusted_close_df.shift(1))
        # Multiply average by 252 which are the trading days in a year
        average_portfolio_returns = portfolio_logarithmic_returns.mean() * 252
        # Covariance and correlation matrices
        covariance_portfolio_returns = portfolio_logarithmic_returns.cov() * 252
        correlation_portfolio_returns = portfolio_logarithmic_returns.corr() * 252
        # Expected portfolio return
        expected_portfolio_return = np.dot(asset_weights, average_portfolio_returns)
        portfolio_volatility_list = []
        for i in range(0, len(asset_weights)):
            portfolio_volatility_list.append(np.sqrt(np.dot(asset_weights[i].T, np.dot(covariance_portfolio_returns, asset_weights[i]))))
        portfolio_volatility_list = np.array(portfolio_volatility_list)
        portfolio_sharpe_ratio = expected_portfolio_return / portfolio_volatility_list
        portfolio_results_df = pd.DataFrame({'returns': expected_portfolio_return, 'volatility': portfolio_volatility_list, 'sharpe_ratio': portfolio_sharpe_ratio})
        num_points = 100
        efficient_portfolio_volatility = []
        indices_to_skip = []
        efficient_portfolio_returns = np.linspace(portfolio_results_df.returns.min(), portfolio_results_df.returns.max(), num_points)
        efficient_portfolio_returns = np.round(efficient_portfolio_returns, 2)
        expected_portfolio_return = np.round(expected_portfolio_return, 2)
        for point_index in range(num_points):
            if efficient_portfolio_returns[point_index] not in expected_portfolio_return:
                indices_to_skip.append(point_index)
                continue
            matched_index = np.where(expected_portfolio_return == efficient_portfolio_returns[point_index])
            efficient_portfolio_volatility.append(np.min(portfolio_volatility_list[matched_index]))
        efficient_portfolio_returns = np.delete(efficient_portfolio_returns, indices_to_skip)
        MARKS = ['o', 'X', 'd', '*']
        fig, ax = plt.subplots()
        portfolio_results_df.plot(kind='scatter', x='volatility', y='returns', c='sharpe_ratio', cmap='RdYlGn', edgecolors='black', ax=ax)
        ax.set(xlabel='Volatility', ylabel='Expected Returns', title='Efficient Frontier')
        for asset_index in range(portfolio_asset_count):
            ax.scatter(x=np.sqrt(covariance_portfolio_returns.iloc[asset_index, asset_index]),
                       y=average_portfolio_returns[asset_index],
                       marker=MARKS[asset_index],
                       s=150,
                       color='black',
                       label=company_symbols[asset_index])
        ax.legend()
        pyscript.display(plt, target="chartContainer")
    except Exception as e:
        print(e)






add_event_listener(document.getElementById("search-companies-btn"), "click", company_data)
add_event_listener(document.getElementById("create-simple-model"), "click", simple_model_data)
add_event_listener(document.getElementById("make-simple-pred-btn"), "click", make_prediction)
add_event_listener(document.getElementById("get-current-portfolio"), "click", portfolio_optimization)

