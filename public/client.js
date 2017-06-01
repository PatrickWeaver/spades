function makeRandString(stringLength) {
  var randString = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < stringLength; i++ )
      randString += characters.charAt(Math.floor(Math.random() * characters.length));

  return randString;
}

function App() {
  return (
    <div>
      <h1>Spades!</h1>
      <Interface />
    </div>
  );
}

class Interface extends React.Component {
  constructor(props) {
    super(props);
    // 🚸 Figure out if this is necessary or not
    this.joinGame = this.joinGame.bind(this);
    this.startGame = this.startGame.bind(this);
    this.onChoice = this.onChoice.bind(this);
    this.state = {
      question: {
        exists: false,
        text: "",
        object: ""
      },
      stage: "loading",
      gameId: "",
      playerId: makeRandString(10)
    }
  }
  // 🚸 Figure out how to not need this, maybe not use strings?
  onChoice(action) {
    if (action === "newGame"){
      this.newGame();
    } else if (action === "joinGame"){
      this.joinGame();
    } else if (action === "startGame"){
      this.startGame();
    }
  }
  
  newGame() {
    this.setState(
      {
        gameId: makeRandString(30)
      },
      this.sendNewGame
    );   
  }
  
  sendNewGame(){
    $.ajax({
        url: "/api/new/",
        data: {
          gameId: this.state.gameId,
          playerId: this.state.playerId
        },
        success: function(data) {
          console.log("New Game Created: " + data);
          /*
          this.setState({
            stage: "waitingForPlayers"
          });
          */
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(err);
        }.bind(this)
    });
  }
  
  joinGame() {
    this.setState({
      question: {
        exists: true,
        text: "Game Id:",
        object: "gameId",
        baseURL: "/api/join/"
      }
    });
  }
  
  /*
  When the 'Start Game' button is clicked send a message to the backend to start the game.
  If there are fewer than 4 players the backend will add robot players.
  🚸 Need to make sure you cannot add more than 4 players.
  */
  startGame() {
    console.log("*********** Start Game");
    // 🚸 Combine ajax calls into a funciton
    $.ajax({
      url: "/api/start/",
      data: {
        gameId: this.state.gameId
      },
      success: function(data) {
        console.log("Game started: " + data);
        /*
        this.setState({
          stage: "waitingForBids"
        });
        */
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(err);
      }.bind(this)
    });
  }
  
  update(gid, stage) {
    //🚸 Use Data variable and update anything?
    console.log("UPDATE!!!!!!!!!!!!!!!!");
    this.setState({
      gameId: gid,
      stage: stage,
      question: {
        exists: false,
        text: "",
        object: "",
        baseURL: ""
      }
    });
  }
  render() {
    if (this.state.question.exists){
      var question = <QuestionForm
        text={this.state.question.text}
        object={this.state.question.object}
        baseURL={this.state.question.baseURL}
        playerId={this.state.playerId}
        gameStage={this.state.stage}
        update={this.update.bind(this)} />
    }
    return (
      <div>
        <h3>Game: {this.state.gameId} <a href={"/api/game/" + this.state.gameId} target="blank">🔗</a></h3>
        <h4>Player: {this.state.playerId} <a href={"/api/game/" + this.state.gameId + "?playerId=" + this.state.playerId} target="blank">🔗</a></h4>
        <h4>Stage: {this.state.stage}</h4>
        {/*🚸 The logic is doubled here, can probably find a way to only have it once.-->*/}
        <Choices stage={this.state.stage} onChoice={this.onChoice} onStage={"beforeStart"} />
        <Choices stage={this.state.stage} onChoice={this.onChoice} onStage={"waitingForPlayers"} />
        {question}
        <Messages url="/api/messages/" pollInterval={4000} gameId={this.state.gameId} playerId={this.state.playerId} update={this.update.bind(this)} />
        <Cards url="/api/hand/" pollInterval={4000} gameId={this.state.gameId} playerId={this.state.playerId} />
      </div>
    )
  }
}


class Choices extends React.Component {
  constructor(props) {
    super(props);
    this.handleButtonClick = this.handleButtonClick.bind(this);
    var show
    console.log("this.props.stage: " + this.props.stage + " (" + typeof this.props.stage + ")");
    console.log("this.props.onStage: " + this.props.onStage + " (" + typeof this.props.onStage + ")");
  }
  handleButtonClick(action){
    this.props.onChoice(action)
  }

  render() {
    if (this.props.stage === this.props.onStage){
      if (this.props.stage === "beforeStart"){
        return(
          <div>
            <GameButton text="New Game" action={"newGame"} onButtonClick={this.handleButtonClick} />
            <GameButton text="Join Game" action={"joinGame"} onButtonClick={this.handleButtonClick} />
          </div>
        )
      } else if (this.props.stage === "waitingForPlayers"){
        return(
          <div>
            <GameButton text="Start Game" action={"startGame"} onButtonClick={this.handleButtonClick} />
          </div>
        )
      }
    } else {
      return(
        <div>
        </div>
      )
    }
  }
}

class GameButton extends React.Component {
  constructor(props) {
    super(props);
    this.clicked = this.clicked.bind(this);
  }
  clicked(clickedFunction) {
    if (clickedFunction){
      clickedFunction(this.props.action);
    }
  }
  render() {
    return(
      <button onClick={() => this.clicked(this.props.onButtonClick)}>
        {this.props.text}
      </button>
    );
  }
}

class QuestionForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      answer: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleChange(e) {
    this.setState({answer: e.target.value});
  }
  handleSubmit(e) {
    e.preventDefault();
    var object = String(this.props.object);
    var data = { playerId: this.props.playerId };
    data[object] = this.state.answer;
    var url = this.props.baseURL;
    console.log("URL: " + url);
    $.ajax({
      url: url,
      data: data,
      success: function(data) {
        console.log("Question sent: " + data);
        this.props.update(this.state.answer, this.props.gameStage);
      }.bind(this),
      error: function(xhr, status, err) {
        console.log("ERRRRRROR!");
        console.error(err);
      }.bind(this)
    });
  }
  
  render() {
    return(
      <form onSubmit={this.handleSubmit}>
        <label>{this.props.text}</label>
        <input value={this.state.answer} onChange={this.handleChange} type="text" />
        <input type="submit" value="submit" />
      </form>
    
    )
  }


}

class Message extends React.Component {
  constructor(props) {
    super(props);
  }
  updateView(){
    //console.log("**");
    var messagesArea = document.getElementById("messages");
    /*
    console.log("Scroll height:");
    console.log(messagesArea.scrollHeight);
    console.log("client Height:");
    console.log(messagesArea.clientHeight);
    console.log("Scroll Top:");
    console.log(messagesArea.scrollTop);
    */
    var isScrolledToBottom = messagesArea.scrollHeight - messagesArea.clientHeight <= messagesArea.scrollTop + 1;
    /*
    console.log("Scrolled to Bottom:");
    console.log(isScrolledToBottom);
    */
    if(!isScrolledToBottom){
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
    /*
    isScrolledToBottom = messagesArea.scrollHeight - messagesArea.clientHeight <= messagesArea.scrollTop + 1;
    console.log("Scrolled to Bottom:");
    console.log(isScrolledToBottom);
    console.log("**");
    */
    
  }
  componentDidMount() {
    this.updateView();
  }
  componentWillUnmount() {
  }
  formatDate() {
    var date = new Date(this.props.message.time);
    var time = "" + date.getHours() + ":" + ('0' + date.getMinutes()).slice(-2);
    return time;
  }
  escapeNewLines() {
    console.log("** ESCAPE! **");
    console.log(this.props.message.text);
    var newText = "<span>"
    newText += (this.props.message.text)
    console.log(newText);
    return newText;
  }
  render() {
    return (
      <div className="message">
        {nl2br(this.props.message.text)}
        <br />
        <span className="time">
          {this.formatDate()}
        </span>
      </div>
    );
  }
}

class Messages extends React.Component {
  constructor(props) {
    super(props);
    this.getMessages = this.getMessages.bind(this);
    this.state = {
      data:[
        {
          "text": "Loading . . .",
          "time": String(new Date())
        }
      ],
      players: []
    }
  }
  
  getMessages() {
    var url = "/api/game/" + this.props.gameId + "?playerId=" + this.props.playerId
    console.log("getMessages() from " + url);
    $.ajax({
      // 🚸 Change this to use this.props.url (also below in error logging)
      url: url,
      dataType: 'json',
      cache: false,
      success: function(game) {
        var messages;
        var players = [];
        var stage;
        // ****
        console.log("Messages:");
        for (var d in game){
          if (d === "messages") {
            messages = game[d];
          }
          if (d === "players") {
            players = game[d];
          }
          if (d === "stage") {
            stage = game[d];
          }
          /*
          if (game[d].text){
            console.log(d + ": " + game[d].text);
          } else {
            console.log(d + ": " + game[d]);
          }
          */
        }
        // ****
        // 🚸 Don't actually need to be updating gameId
        this.props.update(this.props.gameId, stage);
        this.setState({data: messages, players: players});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(url, status, err.toString(), xhr.toString());
      }.bind(this)
    });
  }
  componentDidMount() {
    //this.getMessages();
    //url = String(console.log(this.props.url));
    setInterval(this.getMessages, this.props.pollInterval);
    
  }
  
  componentWillUnmount() {
  }


  render() {
    const messages = this.state.data.map((message, index) =>
      <li key={index}><Message message={message} /></li>                        
    );
    return (
      <div>
        <div id="messages">
          <ul>
            {messages}
          </ul>
        </div>
        <div className="players">
          <h4>Players: {this.state.players.length}</h4>
        </div>
      </div>
    );
  }
}

class Card extends React.Component {
  constructor(props) {
    super(props);
    
  }
  
  render() {
    const classes = "card " + this.props.suit + " c-" + this.props.fullName;
    return (
      <div className={classes}>
        <p>
          {this.props.fullName}
        </p>
      </div>
    );
  }
}


class Cards extends React.Component {
  constructor(props) {
    super(props);
    this.getCards = this.getCards.bind(this);
    this.state = {
      cards:[
      ]
    }
  }
  
  getCards(){
    // 🚸 Change this to use this.props.url (also below in error logging)
    var url = "/api/game/" + this.props.gameId + "?playerId=" + this.props.playerId;
    console.log("getCards() from " + url);
    $.ajax({
      url: url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        var dataz = data[0];
        console.log("**********\n***********");
        for (var i in data){
          console.log(i + ": " + data[i]);
        }
        console.log("**********\n***********");
        var cards = data.cards;
        var playerHand = [];
        console.log(this.props.playerId + "'s" + " Cards:");
        this.setState({cards: cards});
      }.bind(this),
      error: function(xhr, status, err) {
        console.log("No Cards: " + err);
        /*console.error(
          "url, status, err.toString(), xhr.toString()
        );*/
      }.bind(this)
    });
  }
  

  componentDidMount() {
    setInterval(this.getCards, this.props.pollInterval);
  }
  componentWillUnmount() {

  }
  
  render() {
    const cards = this.state.cards.map((card, index) =>
      <li key={index}><Card suit={card.suit} fullName={card.fullName} /></li>                               
    );
    if (cards.length > 0) {
      return(
        <div id="cards">
          <h4>Cards:</h4>
          <ul>
            {cards}
          </ul>
        </div>
      );
    } else {
      return(
        <div id="cards">
          <h4>Cards:</h4>
          <p>No Cards</p>
        </div>
      );
    }
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);