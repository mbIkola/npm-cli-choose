#!/usr/bin/env node 

var Choose = require('../lib/choose');

var _ = require('underscore');
var q = require('q');


var cmdNum = 0;
function prompt() {
    return "##[" + (cmdNum++) +">";
}

var greetings = [

["     И он убит — и взят могилой,     ",
 "     Как тот певец, неведомый, но милый, ",
 "     Добыча ревности глухой,         ",
 "     Воспетый им с такою чудной силой,   ",
 "     Сраженный, как и он, безжалостной рукой. "].join("\n"),


["Зачем от мирных нег и дружбы простодушной",
 "Вступил он в этот свет завистливый и душный",
 "Для сердца вольного и пламенных страстей?",
 "Зачем он руку дал клеветникам ничтожным,",
 "Зачем поверил он словам и ласкам ложным,",
 "     Он, с юных лет постигнувший людей?.."].join("\n"),


 ["А вы, надменные потомки",
  "Известной подлостью прославленных отцов,",
  "Пятою рабскою поправшие обломки",
  "Игрою счастия обиженных родов!",
  "Вы, жадною толпой стоящие у трона,",
  "Свободы, Гения и Славы палачи!",
  "Таитесь вы под сению закона,",
  "Пред вами суд и правда — всё молчи!.. "].join("\n"),

["Но есть и божий суд, наперсники разврата!",
 "Есть грозный суд: он ждет;",
 "Он недоступен звону злата,",
 "И мысли и дела он знает наперед.",
 "Тогда напрасно вы прибегнете к злословью —",
 "Оно вам не поможет вновь,",
 "И вы не смоете всей вашей черной кровью",
 "Поэта праведную кровь! ;"].join("\n")
];

function greeting() {
    var res =   greetings[cmdNum %greetings.length];    

    return res;
}

var floydsongs = require('./pink.floyd/songs');
var floydplaylistindex = 0; 
var defaultActions = {

    "sign-like-gilmour" : {
        description : "Signing something from David Gilmour using q.promises ",
        action : function(args) {
            function sign(song) {
                var lines = song.split("\n");
                var index = 0; 
                var deferred = q.defer();
                var interval = setInterval( function() {
                    var padding = new Array(index % 4+1).join("\t") ;
                    var emptyLine = index % 4 === 0 ? "\n" : "";
                    process.stdout.write([padding, lines[index++] , "\n" , emptyLine].join('') );

                    if (index === lines.length )  {
                        deferred.resolve();
                        clearInterval(interval);
                    } 
                }, 1700);
                return deferred.promise; 
            }

            var songs = _.keys(floydsongs);

            var songname = songs[floydplaylistindex++  % songs.length ]; 
            if ( args.length > 0 ) {
                songname = args[0];   
            }



            if ( typeof floydsongs[songname] === "undefined" ) {
                throw new Error("I don't know any Floyd songs named `" + songname + "'. " + 
                                "Create pull-request with this song if you remember it.");
            }
            return sign(floydsongs[songname]);
        },
        aliases : [ "sign-like-pinkfloyd", "sign-like-roger-waters" ],
        completer : function( line, cb ) {
            line = line.split(" ").slice(1);
            var hits = _.keys(floydsongs).filter(function(song) {
               return ~song.indexOf(line);
            });
            var results = [ hits.length ? hits : _.keys(floydsongs), line]; 
            if ( typeof cb === "function" ) {
                cb(null, results);
            } 
            return results;
        }
    }


};


var choose = new Choose(defaultActions,greeting, prompt);

choose.addAction( 
        [ "kill", "kill-all-humans"], 
        function() {
            console.log([
                        "Baby, you can drive my car, and maybe i'll love you. ",
                        "Baby, it's understood. Working for peanuts is all very fine, but i can show you better time!",
                        "Listen, babe, i've got something to say. I got no car, and it's breaking my heart, " + 
                        "but i found a driver, that's a start"].join("\n")
            );
        },
        "Few lines from some TheBeatles song choosed by magical random"
);


choose.cli();
