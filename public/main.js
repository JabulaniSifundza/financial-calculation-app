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
    const data = await response.json()
    console.log(data)
}

document.getElementById("test-btn").addEventListener("click", ()=>{
    calculate_capm()
})

function turner(){
    return "William Turner"
}
