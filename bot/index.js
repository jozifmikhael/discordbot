const {Client, Intents, MessageActionRow, MessageButton} = require('discord.js');
const {token} = require("../config.json");
const { TicTacToe } = require("./dbObjects.js");

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
// This code will happen one time to know when our bot is connected and able to 
// recieve new events
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Simple bot command to reply with "pong" if previous message is ping
client.on('message', (message) => {
    // check if previous message is from bot, if so do nothing.
    if (message.author.id === client.user.id) return;

    if (message.content === "ping"){
        message.reply("pong");
    }
});

/* Tic Tac Toe*/

// define initial state of tic tac toe gameboard
let EMPTY = Symbol("empty");
let PLAYER = Symbol("player");
let BOT = Symbol("bot");
let  tictactoe_state;

function makeGrid(){
    components = [];
    
    for (let row = 0; row < 3; row++){
        actionRow = new MessageActionRow()
        
        for (let col = 0; col < 3; col++){
            messageButton = new MessageButton()
            .setCustomId('tictactoe_' + row + '_' + col)
            
            switch(tictactoe_state[row][col]){
                case EMPTY:
                    messageButton
                    .setLabel(' ')
                    .setStyle('SECONDARY')
                    break;
                case PLAYER:
                    messageButton
                    .setLabel('X')
                    .setStyle('PRIMARY')
                    break;
                case BOT:
                    messageButton
                    .setLabel('O')
                    .setStyle('DANGER')
                    break;   
            }

            actionRow.addComponents(messageButton);
        }
        components.push(actionRow)
    }
    return components;
}

function getRandomInt(max){
    return Math.floor(Math.random() * max);
}

function isDraw(){
    for (let row = 0; row < 3; row++){
        for (let col = 0; col < 3; col++){
            if (tictactoe_state[row][col] == EMPTY){
                return false;
            }
        }
    }
    return true;
}

function isGameOver(){

    for (let i = 0; i < 3; i++){
        if (tictactoe_state[i][0] === tictactoe_state[i][1] && tictactoe_state[i][1] === tictactoe_state[i][2] && tictactoe_state[i][2] != EMPTY)
        return true;
    }

    for (let i = 0; i < 3; i++){
        if (tictactoe_state[0][i] === tictactoe_state[1][i] && tictactoe_state[1][i] === tictactoe_state[2][i] && tictactoe_state[2][i] != EMPTY)
        return true;
    }

    if (tictactoe_state[1][1] != EMPTY){
        if (tictactoe_state[0][0] == tictactoe_state[1][1] && tictactoe_state[1][1] == tictactoe_state[2][2] || 
            tictactoe_state[2][0] == tictactoe_state[1][1] && tictactoe_state[1][1] == tictactoe_state[0][2])
        return true;
    }

    return false;
}

// interaction for interacting with buttons
client.on('interactionCreate', async interaction =>{
    // if interaction isnt with a button or has a different ID, do nothing
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('tictactoe')) return;

    // Prevent player from clicking empty squares once they have lost
    if (isGameOver()){
        interaction.update({
            components: makeGrid()
        })
        return;
    }

    // split ID by underscore to retrieve position
    let parsedFields = interaction.customId.split("_")
    let row = parsedFields[1];
    let col = parsedFields[2];

    // check if current button is already occupied, if so let user know
    if (tictactoe_state[row][col] != EMPTY){
        interaction.update({
            components: makeGrid(),
            content: "You can't select that position :rage:"
        })
        return;
    }

    tictactoe_state[row][col] = PLAYER;

    if (isGameOver()){
        let user = await TicTacToe.findOne({
            where: {
                user_id: interaction.user.id
            }
        });

        if (!user){
            user = await TicTacToe.create({user_id: interaction.user.id});
        }

        await user.increment('score');

        interaction.update({
            components: [],
            content: "You won the game of tic-tac-toe :sunglasses:. You have now won " + (user.get('score')+1) +" time(s)"
        })

        return;
    }

    if (isDraw()){
        interaction.update({
            components: [],
            content: "The game resulted in a draw!"
        })
        return;
    }

    // Bot Functionality
    let botRow
    let botCol
    do {
        botRow = getRandomInt(3)
        botCol = getRandomInt(3)
    } while (tictactoe_state[botRow][botCol] != EMPTY);
    
    tictactoe_state[botRow][botCol] = BOT;

    if (isGameOver()){
        interaction.update({
            components: makeGrid(),
            content: "You lost the game of tic-tac-toe :cry:"
        })
        return;
    }

    
    if (isDraw()){
        interaction.update({
            components: [],
            content: "The game resulted in a draw!",
        })
        return;
    }

    // Can only do one update per interaction
    interaction.update({
        content: " ",
        components: makeGrid()
    })
})

// async means this function must return Promise
// interaction for the tic tac toe command
client.on('interactionCreate', async interaction => {

    // if interaction isnt a command do nothing
    if (!interaction.isCommand()) return;

    const {commandName} = interaction;
    
    if (commandName === 'tictactoe'){
        tictactoe_state = [
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY]
        ]
        // await makes this function wait for the Promise, await can only be used
        // inside async functions
        await interaction.reply({content: 'Playing a game of tic-tac-toe!', components: makeGrid()});
    }
});

/*Tic-Tac-Toe Finish */

// Logging in to discord API, turning on the bot
client.login(token);