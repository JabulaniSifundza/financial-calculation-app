document.getElementById("add-ticker-btn").addEventListener("click", ()=>{
    const ticker_inputs = document.getElementById("ticker-inputs")
    const new_ticker = document.createElement("input")
    new_ticker.setAttribute("type", "text")
    new_ticker.setAttribute("name", "ticker-symbol")
    new_ticker.setAttribute("placeholder", "Ticker Symbol")
    ticker_inputs.appendChild(new_ticker)
})

function structure_data(){
    return calculate_capm()
}

async function calculate_capm(){
    const ticker_symbols = document.getElementsByName("ticker-symbol")
    const ticker_symbols_list = []
    const benchmark_selector = document.getElementById("benchmark")

    const selected_benchmark = benchmark_selector.options[benchmark_selector.selectedIndex].value
    ticker_symbols.forEach(ticker_symbol => {
        ticker_symbols_list.push(ticker_symbol.value)
    })
    const response = await fetch("/api/capm", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ticker_symbols: ticker_symbols_list,
            benchmark_ticker: selected_benchmark
        })
    })
    //console.log(ticker_symbols_list)
    const data = await response.json()
    //console.log(data)
    const company_data = data.company_result
    const benchmark_data = data.benchmark_data
    const risk_free_data = data.risk_free_data
    const company_beta_values = data.beta_result
    const stock_prices = JSON.stringify(company_data)
    const benchmark_prices = JSON.stringify(benchmark_data)
    const risk_free_rate = JSON.stringify(risk_free_data)
    const beta_data = JSON.stringify(company_beta_values)
    console.log(beta_data)
    return [stock_prices, benchmark_prices, risk_free_rate, beta_data]
}

document.getElementById("test-btn").addEventListener("click", ()=>{
    calculate_capm()
})

function turner(){
    return "William Turner"
}
