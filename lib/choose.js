/*
 * npm-cli-choose
 * https://github.com/mbIkola/npm-cli-choose
 *
 * Copyright (c) 2014 Nickolay (mbIkola) Kharchevin
 * Licensed under the WTFPL license.
 */

'use strict';

var util     = require('util');
var events   = require('events'); 
var _        = require('underscore');
var q        = require('q');
var Table    = require('cli-table');
var readline = require('readline');



function  FarewellMessage() {
    return { 
        toString: function() { 
            return this.messages[this.prototype.mistakes_done++ % this.messages.length ]; 
        }.bind(this)
    };
}

FarewellMessage.prototype.mistakes_done = 0; 
FarewellMessage.prototype.messages = [
    "Baby, you can drive my car, and maybe i'll love you. ",
    "Baby, it's understood. Working for peanuts is all very fine, but i can show you better time!",
    "Listen, babe, i've got something to say. I got no car, and it's breaking my heart, " + 
        "but i found a driver, that's a    start",
    "Мертвые рыбы в иссохшей реке, зловонный зной пустыни, моя смерть разрубит цепи сна - когда мы будем вместе",
    "Спи сладким сном, не помни о прошлом. Дом где жила ты - пуст и заброшен.",
];

function UsageAction(instance){
    return function() { 
        instance.showUsage.apply(instance, arguments);
    };
}
function QuitAction(){
    return function() {
        process.stdout.write(
               [ "How blind can you be, don't you see",
                 "You chose the long road but we'll be waiting",
                 "Bye Bye Beautiful", ""].join("\n")
        );
        process.exit(); 
    };
}

var helpScreenReconfigurationImmediate = null; 


function Choose( actions, greetings, prompt ) {
    //this.actions = actions || {};
    this.greeting = typeof greetings === "function" ? greetings : function() { return greetings; }; 
    this.prompt = typeof prompt === "function" ? prompt : function() { return prompt; } ;  

    for ( var i=0, keys = _.keys(actions), len = keys.length; i<len; ++i) {
        var theAction = actions[keys[i]];
        var names = [keys[i]];
        if ( typeof theAction.aliases !== "undefined"  ) {
            names = names.concat(theAction.aliases);
        }

        this.addAction(names, theAction.action, theAction.description, theAction.completer);
    }


    this.addActionIfNotSet(
            ["exit", "quit", "gotohell"], 
            new QuitAction(this), 
            "Makes me so sad that i gotta leave you alone. "
    );
    this.addActionIfNotSet(
            ["help", "usage", "wtf"], 
            new UsageAction(this), 
            "Show this screen. \n" +
            "Try out help [cmd] - and probably you'll see some help about [cmd]"
    );


}

util.inherits(Choose, events.EventEmitter); 

Choose.prototype = _.extend(Choose.prototype, {
    usageScreen : null,
    actions : {},
    aliases : {},
    completions : [], 

    configureHelpScreen : function() {
        
        if ( helpScreenReconfigurationImmediate ) {
            clearImmediate(helpScreenReconfigurationImmediate);
        }
        helpScreenReconfigurationImmediate = setImmediate( function() { 
            var commandsList = new Table({
                style : { compact: false }
            });

            var keys = _.keys(this.actions);
            for ( var i=0, length = keys.length; i<length; ++i) {
                commandsList.push( [
                     keys[i], 
                     (typeof this.actions[keys[i]].description === "undefined" ? "" : this.actions[keys[i]].description) +
                     (this.actions[keys[i]].aliases.length > 0 ? "\nAliases: " +  this.actions[keys[i]].aliases.join(',') : "" )
                ]);

            }

            this.usageScreen = commandsList.toString(); 
        }.bind(this));

    },

    showUsage : function( args ) { 
        var cmd = args.length ? args[0] : void 0; 
        if  ( cmd === void 0  || !cmd  || typeof this.actions[cmd].usage === "undefined" ) {
            process.stdout.write(this.greeting() + "\n");
            process.stdout.write(this.usageScreen + "\n" );
            process.stdout.write(this.farewell() + "\n");
        } else {
            process.stdout.write( cmd + ": " + this.actions[cmd].description + "\n");
        }

    },

    farewell : function() { 
        return new FarewellMessage().toString();
    },

    addAction : function( names, func, description, completer) { 
        if ( ! (names instanceof Array) ) {
            names = [names]; 
        }

        var name = names[0],
            aliases = names.slice(1) || [];

        this.actions[name] = {
            name   : name,
            aliases : aliases,
            action : func,
            description: description ,
            completer : completer 
        };

        this.completions.push(name);
        for ( var i=0; i<aliases.length; ++i) {
            this.aliases[aliases[i]] = name ;
            this.completions.push(aliases[i]);
        }


        this.configureHelpScreen();
        return this;
    },
    addActionIfNotSet : function( names, func, description, completer ) {

        if( ! names  instanceof Array ) { 
            names = [names];
        } 
        for ( var i=0, len = names.length; i<len; ++i ) {
            if (typeof this.actions[names[i]] !== "undefined" ) {
                return false;
            }
        }

        this.addAction(names, func, description, completer);
        return true;
    },


    cli : function() {
        this.readline = readline.createInterface(
                process.stdin,
                process.stdout,
                this.completer.bind(this)
        );
        this.readline.on('line', function ( cmd ) { 
            this.exec(cmd);
        }.bind(this)).on('close', function() {
            process.stdout.write("\n");
            this.readline = null;
        });
       
        process.stdout.write(this.greeting());
        this.dance();
    },

    exec : function (cmd) {
        cmd = cmd.trim().replace(/\s+/g, ' ').split(/\s/);
        var command = cmd[0];
        var args = cmd.slice(1);

        var action_result = null; 
        if (  typeof this.aliases[command] !==  "undefined" ) {
            console.log("Using alias " + command + " for " + this.aliases[command] );
            command = this.aliases[command];
        }

        try { 
            if ( typeof this.actions[command] !== "undefined" ) {
                action_result = this.actions[command].action.call(null, args); 
            } else if (command.length !== 0 ) {
                throw new Error("Unrecognized command `" + command  + "'. Type `help' if you're lost. \n");
            }
        } catch ( err ) {
            process.stdout.write("Error: " + err );
        }

        // infine loop here. 
        var im_happy_just_to_dance_with_you = this.dance.bind(this); 
        if ( q.isPromise(action_result) ) {
            action_result.done(im_happy_just_to_dance_with_you);
        } else {
            im_happy_just_to_dance_with_you.call(null);
        }
    },

    dance : function() {
        this.readline.setPrompt(this.prompt());
        this.readline.prompt();
    },
    completer : function(line, cb) {

        var cmd = line.split(" ")[0];
        if (  typeof this.aliases[cmd] !==  "undefined" ) {
            cmd = this.aliases[cmd];
        }


        if ( cmd.length && 
             typeof this.actions[cmd] !== "undefined" &&
             typeof this.actions[cmd].completer  === "function" 
           ) {
                 return this.actions[cmd].completer.call(null, line, cb);
        }
        
        var hits = this.completions.filter( function(it) { 
            return ~it.indexOf(line); 
        });
        
        var results = [hits.length ? hits : this.completions, line];

        if ( typeof cb === "function" ) {
            cb(null, results);
        } else { 
            return results;
        }
    }

});




module.exports = Choose;


