Title = {};

Title.Client = Client;
Title.game = null;

Title.init = function(game){
    this.game = game;
    this.game.stage.disableVisibilityChange = true;
};

Title.preload = function() {
    this.game.load.image('title', 'assets/title.png');
    this.game.load.spritesheet('buttons', 'assets/buttons.png',196,64);
};

Title.create = function() {
    var title = this.game.add.image(this.game.world.centerX, this.game.world.centerY, 'title');
    title.anchor.setTo(0.5, 0.5);
    var bFM = this.game.add.button(
        0,0,
        'buttons',
        function() {
            this.Client.newGame(GameType.RandomMatch);
        },
        this
    );
    bFM.frame = 0;
    var bVSAI = this.game.add.button(
        0,128,
        'buttons',
        function() {
            //this.game.state.start("Game",true,false,this.game,{type: GameType.AI});
            this.Client.newGame(GameType.AI);
        },
        this
    );
    bVSAI.frame = 2;
}

