import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'; // Required to parse arguments correctly
import { getNotes, addNotes, removeNotes } from './notes.js';
const argv = yargs(hideBin(process.argv))
    .version('1.1.0')
    .command({
        command: 'add',
        describe: 'Add a new note',
        builder: {
            title: {
                describe: "Note title",
                demandOption: true,
                type: 'string',
            },
            body: {
                describe: "Note body",
                demandOption: true,
                type: 'string',
            }
        },
        handler: function (argv) {
            addNotes(argv.title, argv.body)
        },
    })
    .command({
        command: 'remove',
        describe: 'Remove note',
        builder: {
            title: {
                describe: "Note title",
                demandOption: true,
                type: 'string',
            }
        },
        handler: function (argv) {
            removeNotes(argv.title)
        },
    })
    .help() // Adds the help command
    .argv;

