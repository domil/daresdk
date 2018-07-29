var matchesInRound = function(numPlayers,teams) {
  var matches = Math.ceil(numPlayers / teams);
  return matches;
};

var numberOfRounds = function(numPlayers,teams){
  var rounds = 0;
  console.log('numplayers', numPlayers);
  var roundCounter = function(players) {
    var matches = matchesInRound(players,teams);
    //console.log('players', players);
    if (matches === 1) {
      rounds++;
      return;
    } else {
      rounds++;
      roundCounter(matches);
    }
  };

  roundCounter(numPlayers);

  return rounds;
};

exports.matchesInRound = matchesInRound;
exports.numberOfRounds = numberOfRounds;