/*
 * npm-cli-choose
 * https://github.com/mbIkola/npm-cli-choose
 *
 * Copyright (c) 2014 Nickolay (mbIkola) Kharchevin
 * Licensed under the WTFPL license.
 */

'use strict';



var prompt_reader = require('co-prompt');
var q = require('q');

var Table = require('cli-table');


module.exports =  function choose( actions, usage, prompt ) {
    
    var im_happy_just_to_dance_with_you = prompt_reader(prompt());
    
    var mistakes_done = 0; 
    function processUserInput(nothing, something) {
        something = something? something.trim().split(/\s+/) : [];
        var cmd     = something.shift();
        if ( cmd ) {
            cmd = cmd.toLowerCase() ;
        } else {
            cmd = "";
        }

        var should_exit = false;
        if ( ["quit", "exit", "gotohell"].indexOf(cmd) !== -1 ) {
            should_exit = true; 
        } else if ( 
                cmd.length !== 0 && 
                ( 
                 ["usage", "help", "wtf", "?" ].indexOf(cmd) !== -1 || 
                  typeof actions[cmd] === "undefined"                      
                ) 
           ) 
        {

            var usage_message = "";
            if ( ["usage", "help", "wtf", "?" ].indexOf(cmd) === -1 ) {
                // not a help; 
                usage_message = "Unknown command `" + cmd + "' \n";
            }

            if ( typeof usage === "function" )  { usage_message += usage(cmd, something);  }
            if ( typeof usage === "string"   )  { usage_message += usage;  }

            var table = new Table( { 
                //head: ["Command", "Description"], 
                colWidths : [ 15, 80 ],
                style : { compact: false } 
            });

            //var actionsList = ""; 
            for ( var i in actions  ) {
                if ( ! actions.hasOwnProperty(i) )  { continue;  }
                table.push( [ i, actions[i].description ]);
                //actionsList += "\t"  + i + "\t" + actions[i].description + "\n";
            }
            table.push( [ "help", 
                          "Show help. Alias: 'usage'. " + 
                          "Sometimes could be used as `help [cmd]` \n" + 
                          "and probably may show some help about command."]);
            table.push([ "quit", "Alias 'exit'. Makes me so sad that i gotta leave you alone. " ]);


//            actionsList += "\thelp\t Show help. Alias: 'usage'. Sometimes could be used as `help [cmd]` and probably may show some help about command.\n";
//            actionsList += "\tquit\t Alias 'exit'. Makes me so sad that i gotta leave you alone. \n";
 

            var postfix  = [
                "Baby, you can drive my car, and maybe i'll love you. ",
                "Baby, it's understood. Working for peanuts is all very fine, but i can show you better time!",
                "Listen, babe, i've got something to say. I got no car, and it's breaking my heart, but i found a driver, that's a start"
            ][mistakes_done++ % 3]; 

            var actionsList = table.toString();
            process.stdout.write( 
                usage_message + "\n\n" + 
                "Registered actions : \n" + 
                    actionsList + 
                    "\n" + postfix +"\n"
            );
        }

        var action_result = null; 
        if ( typeof actions[cmd] !== "undefined" ) { 
            action_result = actions[cmd].action.call(null, something);
        }

        function ask_next() {
            im_happy_just_to_dance_with_you(processUserInput);
        }
        (function(should_exit, action_result) { 
            switch ( true ) {
                case should_exit: return function() { process.exit() ; };  
                case q.isPromise(action_result): return function() { action_result.done(ask_next); }; 
                default: return ask_next;
            }
        })(should_exit, action_result).call(null);

    }

    processUserInput();

};


