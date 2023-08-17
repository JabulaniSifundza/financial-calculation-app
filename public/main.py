import numpy as np
import pandas as pd
import scipy as sc
import sklearn
import statsmodels.api as sm
import json
from js import calculate_capm, structure_data, console, document
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
    avg_return_arr = []
    market_return_arr = []
    for symbol in company_tickers:
        # print(companies[symbol])
        stock_price_data = companies[symbol]
        stock_price_df = pd.DataFrame(stock_price_data)
        stock_price_df = stock_price_df.set_index(['date'])
        X = stock_price_df['close'].pct_change().mean() * 252
        avg_return_arr.append({symbol: X})
    for industry_avg in benchmark_ticker:
        benchmark_data = benchmark[industry_avg]
        benchmark_df = pd.DataFrame(benchmark_data)
        benchmark_df = benchmark_df.set_index(['date'])
        Y = benchmark_df['close'].pct_change().mean() * 252
        market_return_arr.append({industry_avg: Y})
    # print(market_return_arr)
    for obj in avg_return_arr:
        for obj_key, obj_val in obj.items():
            new_p = js.document.createElement("p")
            new_p.innerHTML = f"key: {obj_key}, value: {obj_val}"
            div_to_insert = js.document.querySelector('#div-to-insert')
            div_to_insert.appendChild(new_p)
            # print(f"key: {obj_key}, value: {obj_val}")
    print(beta_values)
    print(avg_return_arr)
    print(risk_free_rate[0]['close'])
    
# Run the main function
add_event_listener(document.getElementById("search-companies-btn"), "click", company_data)

