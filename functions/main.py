import numpy as np
import pandas as pd
import scipy as sc
import sklearn
import statsmodels.api as sm
from js import calculate_capm, console, document
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

def company_data(*args):
    data = calculate_capm()
    console.log(data)
    
add_event_listener(document.getElementById("search-companies-btn"), "click", company_data)

