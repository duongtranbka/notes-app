import express from 'express';
import fetch from "node-fetch";
import fs from "fs";
import { stringify } from "querystring";
import TelegramBot from "node-telegram-bot-api";
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, Railway!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
const BOT_TOKEN = '7976495530:AAHLJHKVLE9bps8v_NyqnvTzfh-kvIeQMps';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Listen for the '/start' command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `You maximum random is : ${maxCoin()}`);
    bot.sendMessage(chatId, 'Please choose a numder to random between maximum coin');
});

// Listen for any text messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    // Echo the user's message
    if (userMessage !== '/start') {
        const number = parseFloat(userMessage);
        if (!isNaN(number) && number >= 1 && number <= maxCoin()) {
            const randomNum = generateRandomList(number, maxCoin());
            var outputMess = await notifyCoin(randomNum);
            //bot.sendMessage(chatId, `Great! ${number} is within the range.`);

            if (outputMess.length === 0) {
                bot.sendMessage(chatId, "There is no coin approach EMA89, please sleep and come back later !!!")
            } else {
                let content = "";
                for (let i = 0; i < outputMess.length; i++) {
                    content += `${outputMess[i]}\n`;
                }
                console.log(content);
                bot.sendMessage(chatId, content);
            }
            // console.log(`Random number between ${a} and ${b}: ${randomNum}`);
        } else if (!isNaN(number)) {
            bot.sendMessage(chatId, `${number} is out of range. Please send a number between ${MIN_VALUE} and ${MAX_VALUE}.`);
        } else {
            bot.sendMessage(chatId, `That doesn't look like a number. Please send a valid number.`);
        }
    }

});
function generateRandomList(n, b) {
    const randomNumbers = [];
  
    for (let i = 0; i < n; i++) {
      // Generate a random number in the range [0, b]
      const randomNum = Math.floor(Math.random() * (b + 1));
      randomNumbers.push(randomNum);
    }
  
    return randomNumbers;
  }
function maxCoin() {
    const jsonContent = fs.readFileSync("futures_trading_pairs.json", "utf8");
    return JSON.parse(jsonContent).length;
}

async function notifyCoin(listcoins) {
    const jsonContent = fs.readFileSync("futures_trading_pairs.json", "utf8");
    const exceptlist = fs.readFileSync("exceptList.json", "utf8");
    var excepts = JSON.parse(exceptlist);
    var bit = JSON.parse(jsonContent);
    var rsList = [];
    for (var index = 0; index < listcoins.length; index++) {
        const element = bit[listcoins[index]];
        if (excepts.includes(element)) {
            continue;
        }
        const priceCurrent = await getFuturesPrice(element);
        const EMA89Current = await fetchFuturesData(element);
        const EMA21Current = await fetchFuturesDataH1(element);
        //console.log(EMA21Current)
        if (!isNaN(priceCurrent) && EMA89Current !== "0.00") {
            let ratio = (priceCurrent / EMA89Current) * 100;
            if (ratio > 99) {
                if(EMA21Current !== "0.00"){
                    ratio = (priceCurrent / EMA21Current) * 100;
                    if(ratio > 99){
                        rsList.push(element);
                    }
                }
            }
        }
    }
    // if (rsList.length > 0) {
    //     console.log("not null")
    // }
    return rsList;
}

//notifyCoin()

async function getFuturesTradingPairs() {
    const apiUrl = "https://fapi.binance.com/fapi/v1/exchangeInfo"; // Futures exchange info endpoint

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error(`Error fetching data: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        const tradingPairs = data.symbols
            .filter(symbolInfo => symbolInfo.contractType === "PERPETUAL" && symbolInfo.pair.includes("USDT")) // Filter perpetual contracts
            .map(symbolInfo => symbolInfo.symbol); // Extract symbol names

        console.log("Futures Trading Pairs fetched successfully.");
        // Save the trading pairs to a JSON file
        const jsonContent = JSON.stringify(tradingPairs, null, 2); // Beautify the JSON
        fs.writeFileSync("futures_trading_pairs.json", jsonContent, "utf8");
        console.log("Futures Trading Pairs saved to futures_trading_pairs.json");

        return tradingPairs;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return [];
    }
}

// Run the function
//getFuturesTradingPairs();



async function getFuturesPrice(symbol = "BTCUSDT") {
    const apiUrl = `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`; // Futures API endpoint

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error(`Error fetching data: ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        const currentPrice = parseFloat(data.price);
        //console.log(`Current futures price of ${symbol}: ${currentPrice}`);
        return currentPrice;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
    }
}

// Example usage
//getFuturesPrice();

async function fetchFuturesData(symbol = "BTCUSDT") {
    //const symbol = "BTCUSDT";
    const interval = "4h"; // H4 candles
    const limit = 500; // Fetch more candles for accurate EMA
    const apiUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`; // Futures API endpoint for Klines

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error(`Error fetching data: ${response.statusText}`);
            return;
        }

        const data = await response.json();
        const closePrices = data.map(candle => parseFloat(candle[4])); // Extract closing prices

        if (closePrices.length < 89) {
            console.error("Not enough data to calculate EMA89");
            return;
        }

        // Calculate EMA89 for the current candle
        const ema89 = calculateEMA(closePrices, 89); // Include the current candle
        // console.log(`EMA89 of the current H4 candle: ${ema89.toFixed(2)}`);
        return `${ema89.toFixed(2)}`;
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}
async function fetchFuturesDataH1(symbol = "BTCUSDT") {
    //const symbol = "BTCUSDT";
    const interval = "1h"; // H1 candles
    const limit = 500; // Fetch more candles for accurate EMA
    const apiUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`; // Futures API endpoint for Klines

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error(`Error fetching data: ${response.statusText}`);
            return;
        }

        const data = await response.json();
        const closePrices = data.map(candle => parseFloat(candle[4])); // Extract closing prices

        if (closePrices.length < 89) {
            console.error("Not enough data to calculate EMA89");
            return;
        }

        // Calculate EMA89 for the current candle
        const ema89 = calculateEMA(closePrices, 21); // Include the current candle
        //console.log(`EMA89 of the current H4 candle: ${ema89.toFixed(2)} ${symbol}`);
        return `${ema89.toFixed(2)}`;
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}
function calculateEMA(prices, length) {
    const multiplier = 2 / (length + 1); // EMA multiplier
    // Initialize EMA with the SMA of the first `length` prices
    const initialSMA = prices.slice(0, length).reduce((sum, price) => sum + price, 0) / length;
    let ema = initialSMA;

    // Apply EMA formula for the rest of the prices
    for (let i = length; i < prices.length; i++) {
        ema = (prices[i] - ema) * multiplier + ema;
    }
    return ema; // Return the most recent EMA value
}

// Run the function
//fetchFuturesData();
