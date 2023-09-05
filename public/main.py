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
model_global = None
global_model = None

def simple_predictions(model, inpts):
    return model.predict(inpts)
     
async def simple_model_data(*args):
    global global_model
    model_dataframe = await structure_simple_model_data()
    global_model = create_simple_model(model_dataframe)
    return global_model


def create_simple_model(model_dataframe):
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
    model_global = model
    add_model_inpts()
    return model
    

def add_model_inpts():
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

# TODO Rename this here and in `create_model_inpts`
def create_model_inpts(attr, val):
    result = js.document.createElement("input")
    result.setAttribute('type', 'number')
    result.setAttribute('placeholder', attr)
    result.setAttribute('id', val)
    return result
    
def get_prediction_vals():
    open_value = js.document.getElementById("prediction-open").value
    high_value = js.document.getElementById("prediction-high").value
    low_value = js.document.getElementById("prediction-low").value
    close_value = js.document.getElementById("prediction-close").value
    volume_value = js.document.getElementById("prediction-volume").value
    return pd.DataFrame(data=[[open_value, high_value, low_value, close_value, volume_value]], columns=["open", "high", "low", "adjClose", "volume"])

def make_prediction(*args):  # sourcery skip: raise-specific-error
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




add_event_listener(document.getElementById("search-companies-btn"), "click", company_data)
add_event_listener(document.getElementById("create-simple-model"), "click", simple_model_data)
add_event_listener(document.getElementById("make-simple-pred-btn"), "click", make_prediction)

