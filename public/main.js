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

function create_symbol_selector(selector_id, option_array){
    const ticker_symbols = document.getElementsByName(option_array)
    const selector = document.getElementById(selector_id)
    ticker_symbols.forEach(option =>{
        const option_html = `<option value=${option.value}>${option.value}</option>`
        const option_element = document.createElement('option')
        option_element.innerHTML = option_html
        selector.appendChild(option_element)
        return selector.outerHTML
    })
}

async function calculate_capm(){
    try{
        const ticker_symbols = document.getElementsByName("ticker-symbol")
        const benchmark_selector = document.getElementById("benchmark")
        const select_elem = document.getElementById("simple-model-ticker-selector")
        const ticker_symbols_list = []
        const selected_benchmark = benchmark_selector.options[benchmark_selector.selectedIndex].value
        ticker_symbols.forEach(ticker_symbol => {
            ticker_symbols_list.push(ticker_symbol.value)
            const symbol_option = `<option value=${ticker_symbol.value}>${ticker_symbol.value}</option>`
            const option_element = document.createElement('option')
            option_element.innerHTML = symbol_option
            select_elem.appendChild(option_element)
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
        create_symbol_selector("company-financials-selector", "ticker-symbol")
        //console.log(beta_data)
        return [stock_prices, benchmark_prices, risk_free_rate, beta_data]
    }
    catch(error){
        console.log(error);
        alert(`Unfortunately the following error has occurred: ${error}`);
    }
}


function turner(){
    return "William Turner"
}

async function structure_simple_model_data(){
    const simple_model_ticker_selector = document.getElementById("simple-model-ticker-selector")
    const selected_ticker = simple_model_ticker_selector.options[simple_model_ticker_selector.selectedIndex]
    const symbol = selected_ticker.value
    try{
        const response = await fetch("/api/simple", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticker_symbol: symbol
            })
        })
        const data = await response.json()
        const symbol_data = data
        const price_data = JSON.stringify(symbol_data)
        //console.log(price_data)
        return price_data
    }
    catch(error){
        console.log(error)
        alert(`Unfortunately the following error has occurred: ${error}`);
    }
}

async function get_financial_data(){
    const company_selector = document.getElementById("company-financials-selector")
    const selected_ticker = company_selector.options[company_selector.selectedIndex]
    const symbol = selected_ticker.value
    try{
        const response = await fetch("/api/company-financials", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticker_symbol: symbol
            })
        })
        const data = await response.json()
        const symbol_data = data
        const financial_data = JSON.stringify(symbol_data)
        console.log(financial_data)
        return financial_data
    }
    catch(error){
        console.log(error)
        alert(`Unfortunately the following error has occurred: ${error}`);
    }
}

document.getElementById("get-company-financial-data").addEventListener("click", ()=>{
    get_financial_data()
})
