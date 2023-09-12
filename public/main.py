import numpy as np
import pyscript
import pandas as pd
import matplotlib.pyplot as plt
import scipy.optimize as sco
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_score
import json
from js import structure_simple_model_data, structure_data, document, get_portfolio_data, get_monte_symbol_data
from pyodide.ffi.wrappers import add_event_listener
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
global_model = None
risk_free_global = None


async def company_data(*args):
    data = await structure_data()
    # console.log(data)
    global risk_free_global
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
    risk_free_global = risk_free_rate[0]['close']
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
"""Linear Regression
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
    # sourcery skip: for-append-to-extend, list-comprehension, low-code-quality, remove-zero-from-range
    try:
        portfolio_data = await get_portfolio_data()
        # print(portfolio_data)
        portfolio_dict = json.loads(portfolio_data)
        company_symbols = list(portfolio_dict.keys())
        portfolio_asset_count = len(company_symbols)
        flattened_data = [dict(company=company, **values) for company, company_data in portfolio_dict.items() for values in company_data]
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
        portfolio_logarithmic_returns = np.log(adjusted_close_df / adjusted_close_df.shift(1))
        # Multiply average by 252 which are the trading days in a year
        average_portfolio_returns = portfolio_logarithmic_returns.mean() * 252
        # Covariance and correlation matrices
        covariance_portfolio_returns = portfolio_logarithmic_returns.cov() * 252
        correlation_portfolio_returns = portfolio_logarithmic_returns.corr() * 252
        # Expected portfolio return
        # Using Monte Carlo simulations to find efficient frontier
        expected_portfolio_return = np.dot(asset_weights, average_portfolio_returns)
        portfolio_volatility_list = []
        for i in range(0, len(asset_weights)):
            portfolio_volatility_list.append(np.sqrt(np.dot(asset_weights[i].T, np.dot(covariance_portfolio_returns, asset_weights[i]))))
        portfolio_volatility_list = np.array(portfolio_volatility_list)
        portfolio_sharpe_ratio = expected_portfolio_return / portfolio_volatility_list
        portfolio_results_df = pd.DataFrame({'returns': expected_portfolio_return, 'volatility': portfolio_volatility_list, 'sharpe_ratio': portfolio_sharpe_ratio})
        num_points = 500
        efficient_portfolio_volatility = []
        indices_to_skip = []
        efficient_portfolio_returns = np.linspace(portfolio_results_df.returns.min(), portfolio_results_df.returns.max(), num_points)
        efficient_portfolio_returns = np.round(efficient_portfolio_returns, 2)
        expected_portfolio_return = np.round(expected_portfolio_return, 2)
        # print(expected_portfolio_return)
        for point_index in range(num_points):
            if efficient_portfolio_returns[point_index] not in expected_portfolio_return:
                indices_to_skip.append(point_index)
                continue
            matched_index = np.where(expected_portfolio_return == efficient_portfolio_returns[point_index])
            efficient_portfolio_volatility.append(np.min(portfolio_volatility_list[matched_index]))
        efficient_portfolio_returns = np.delete(efficient_portfolio_returns, indices_to_skip)
        MARKS = ['o', 'v', '^', '<', '>', 's', 'p', '*', 'h', 'H', '+', 'x', 'D', 'd', '|', '_', '.', ',', '1', '3', '2', '4', 5, 6, 7, 8, 9, 10, 'P']
        fig, ax = plt.subplots()
        portfolio_results_df.plot(kind='scatter', x='volatility', y='returns', c='sharpe_ratio', cmap='RdYlGn', edgecolors='black', ax=ax)
        ax.set(xlabel='Volatility', ylabel='Expected Returns', title='Efficient Frontier')
        for asset_index in range(portfolio_asset_count):
            ax.scatter(x=np.sqrt(covariance_portfolio_returns.iloc[asset_index, asset_index]),
                       y=average_portfolio_returns[asset_index],
                       s=150,
                       marker=MARKS[asset_index % len(MARKS)],
                       color='black',
                       label=company_symbols[asset_index])
        ax.legend()
        pyscript.display(plt, target="chartContainer")
        # print(portfolio_results_df)
        # Calculating the Tangency portfolio - Has the highest Sharpe Ratio/ Maximum expected return per unit of risk
        max_sharpe_ratio_idx = np.argmax(portfolio_results_df.sharpe_ratio)
        max_sharpe_ratio_port = portfolio_results_df.loc[max_sharpe_ratio_idx]
        min_volatility_idx = np.argmin(portfolio_results_df.volatility)
        min_volatility_port = portfolio_results_df.loc[min_volatility_idx]
        # Maximum sharpe ratio portfolio
        portfolio_1_div = js.document.querySelector('#portfolio-breakdown-1')
        portfolio_3_div = js.document.querySelector('#portfolio-breakdown-3')
        for idx, val in max_sharpe_ratio_port.items():
            portfolio_stats = js.document.createElement("p")
            portfolio_stats.innerHTML = f"{idx}: {100 * val: .2f}%"
            portfolio_1_div.appendChild(portfolio_stats)
        for x, y in zip(company_symbols, asset_weights[np.argmax(portfolio_results_df.sharpe_ratio)]):
            portfolio_weights = js.document.createElement("p")
            portfolio_weights.innerHTML = f"{x}: {100 * y: .2f}%"
            portfolio_1_div.appendChild(portfolio_weights)
        # Minimum Volatitlity Portfolio
        for idx, val in min_volatility_port.items():
            min_volatility_portfolio_stats = js.document.createElement("p")
            min_volatility_portfolio_stats.innerHTML = f"{idx}: {100 * val: .2f}%"
            portfolio_1_div.appendChild(min_volatility_portfolio_stats)
        for x, y in zip(company_symbols, asset_weights[np.argmin(portfolio_results_df.volatility)]):
            min_volatility_portfolio_weights = js.document.createElement("p")
            min_volatility_portfolio_weights.innerHTML = f"{x}: {100 * y: .2f}%"
            portfolio_1_div.appendChild(min_volatility_portfolio_weights)
        figure, axis = plt.subplots()
        portfolio_results_df.plot(kind='scatter', x='volatility', y='returns', c='sharpe_ratio', cmap='RdYlGn', edgecolors='black', ax=axis)
        axis.scatter(x=max_sharpe_ratio_port.volatility, y=max_sharpe_ratio_port.returns, c='black', marker='*', s=200, label='Maximum Sharpe Ratio')
        axis.scatter(x=min_volatility_port.volatility, y=min_volatility_port.returns, c='black', marker='P', s=200, label='Minimum Volatility')
        axis.set(xlabel='Volatility', ylabel='Expected Returns', title='Efficient Frontier')
        axis.legend()
        pyscript.display(plt, target="chart2Container")
        # Efficient Frontier using Optimization
        rtns_range = np.linspace(-0.22, 0.32, 200)
        efficient_ports = get_frontier(average_portfolio_returns, covariance_portfolio_returns, rtns_range)
        volatility_range = [x['fun'] for x in efficient_ports]
        chart, axes = plt.subplots()
        portfolio_results_df.plot(kind='scatter', x='volatility', y='returns', c='sharpe_ratio', cmap='RdYlGn', edgecolors='black', ax=axes)
        axes.plot(volatility_range, rtns_range, 'b--', linewidth=3)
        axes.set(xlabel='Volatility', ylabel='Expected Returns', title='Efficient Frontier')
        pyscript.display(plt, target="chart3Container")
        optimized_min_volatility = np.argmin(volatility_range)
        optimized_min_port_return = rtns_range[optimized_min_volatility]
        optimized_min_port_vol = efficient_ports[optimized_min_volatility]['fun']
        min_optimized_port_vol = {'Return': optimized_min_port_return, 'Volatility': optimized_min_port_vol, 'Sharpe Ratio': (optimized_min_port_return / optimized_min_port_vol)}
        for index, value in min_optimized_port_vol.items():
            optimized_port_stats = js.document.createElement("p")
            optimized_port_stats.innerHTML = f"{index}: {100 * value: .2f}%"
            portfolio_3_div.appendChild(optimized_port_stats)
        for x, y in zip(company_symbols, efficient_ports[optimized_min_volatility]['x']):
            optimized_port_weights = js.document.createElement("p")
            optimized_port_weights.innerHTML = f"{x}: {100 * y:.2f}%"
            portfolio_3_div.appendChild(optimized_port_weights)
        # Finding the Tnagency Portfolio
        number_of_assets = len(average_portfolio_returns)
        new_args = (average_portfolio_returns, covariance_portfolio_returns, risk_free_global)
        new_constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        new_bounds = tuple((0, 1) for _ in range(number_of_assets))
        initial_value = number_of_assets * [1. / number_of_assets]
        maximum_sharpe = sco.minimize(negative_sharpe_ratio, x0=initial_value, args=new_args, method='SLSQP', bounds=new_bounds, constraints=new_constraints)
        new_maximum_sharpe_weights = maximum_sharpe['x']
        maximum_sharpe_port = {'Return': get_portfolio_rtn(new_maximum_sharpe_weights, average_portfolio_returns), 'Volatility': get_portfolio_volatility(new_maximum_sharpe_weights, average_portfolio_returns, covariance_portfolio_returns), 'Sharpe Ratio': -maximum_sharpe['fun']}
        for i, j in maximum_sharpe_port.items():
            optimized_port_stats = js.document.createElement("p")
            optimized_port_stats.innerHTML = f"{i}: {100 * j: .2f}%"
            portfolio_3_div.appendChild(optimized_port_stats)
        for x, y in zip(company_symbols, new_maximum_sharpe_weights):
            optimized_port_weights = js.document.createElement("p")
            optimized_port_weights.innerHTML = f"{x}: {100 * y:.2f}%"
            portfolio_3_div.appendChild(optimized_port_weights)
    except Exception as e:
        print(e)


def get_portfolio_rtn(weight, avg_rtns):
    return np.sum(avg_rtns * weight)


def get_portfolio_volatility(weight, avg_rtns, covariance_matrix):
    return np.sqrt(np.dot(weight.T, np.dot(covariance_matrix, weight)))


def get_frontier(avg_rtns, covariance_matrix, rtns_range):
    efficient_portfolios = []
    n_assets = len(avg_rtns)
    args = (avg_rtns, covariance_matrix)
    bounds = tuple((0, 1) for _ in range(n_assets))
    initial_guess = n_assets * [1. / n_assets]
    for retrn in rtns_range:
        constraints = ({'type': 'eq', 'fun': lambda x: get_portfolio_rtn(x, avg_rtns) - retrn}, {'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        efficient_portfolio = sco.minimize(get_portfolio_volatility, initial_guess, args=args, method='SLSQP', constraints=constraints, bounds=bounds)
        efficient_portfolios.append(efficient_portfolio)
    return efficient_portfolios


def negative_sharpe_ratio(weights, average_returns, covariance_matrix, risk_free_rate):
    portolio_returns = np.sum(average_returns * weights)
    portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(covariance_matrix, weights)))
    return (portolio_returns - risk_free_rate) / portfolio_volatility


async def run_monte_carlo_sims(*args):
    try:
        symbol_df = await get_monte_symbol_data()
        symbol_df = json.loads(symbol_df)
        symbol_df = pd.DataFrame(symbol_df['data'])
        symbol_df['date'] = pd.to_datetime(symbol_df['date'])
        symbol_df = symbol_df.set_index(['date'])
        closing_price = symbol_df['adjClose']
        average_return = closing_price.pct_change().dropna()
        train = average_return.iloc[:-30]
        test = average_return.iloc[-30:]
        T = len(test)
        N = len(test)
        S_O = closing_price[train.index[-1].date()]
        mu = train.mean()
        sigma = train.std()
        sim_count = 1000
        brownian_motion_sims = simulate_brownian(S_O, mu, sigma, sim_count, T, N)
        LAST_TRAIN_DATE = train.index[-1].date()
        FIRST_TEST_DATE = train.index[0].date()
        LAST_TEST_DATE = train.index[-1].date()
    except Exception as e:
        print(e)


def simulate_brownian(S_O, mu, sigma, n_sims, T, N):
    dt = T / N
    dW = np.random.normal(scale=np.sqrt(dt), size=(n_sims, N))
    W = np.cumsum(dW, axis=1)
    time_step = np.linspace(dt, T, N)
    time_steps = np.broadcast_to(time_step, (n_sims, N))
    S_t = S_O * np.exp((mu - 0.5 * sigma ** 2) * time_steps + sigma * W)
    S_t = np.insert(S_t, 0, S_O, axis=1)
    return S_t


add_event_listener(document.getElementById("search-companies-btn"), "click", company_data)
add_event_listener(document.getElementById("create-simple-model"), "click", simple_model_data)
add_event_listener(document.getElementById("make-simple-pred-btn"), "click", make_prediction)
add_event_listener(document.getElementById("get-current-portfolio"), "click", portfolio_optimization)
add_event_listener(document.getElementById("run-monte-carlo"), "click", run_monte_carlo_sims)
