App.Views.VideoPlayer = Backbone.View.extend({

  template: _.template( $('#videoTemplate').html() ),

  className: 'video',

  initialize: function () {
    this.collection.each(this.render, this);

    var self = this;
    window.YTEvents = window.YTEvents || [];
    var obj = {};
    obj[this.id] = function(){
      self.createHeatmap(self.model.get('width'),self.model.player.getDuration(), self.model.id);
    };
    window.YTEvents.push(obj);
  },

  render: function (videoPlayer) {
    this.$el.append(this.template( videoPlayer.toJSON() ));
    this.$el.appendTo('body');
    this.createPlugins();
    this.createComponents();
    this.createVideo.call(videoPlayer);
  },

  events: {
    'click .btn': 'createVote',
    'click .vjs-heat-button': 'toggleHeatmap'
  },

  createButtonConstructor: function(player, options){
    return videojs.Button.extend({
      init: function(player, options){
        videojs.Button.call(this, player, options);
      }
    });
  },

  createComponents: function(){
    videojs.CreateShowHeat = this.createButtonConstructor();
    videojs.CreateUpVote = this.createButtonConstructor();
    videojs.CreateDownVote = this.createButtonConstructor();
  },

  createButton: function(buttonType) {
    var buttonProperties = {
      upVote: {class: 'upvote-button', text: 'Upvote Button'},
      downVote: {class: 'downvote-button', text: 'Downvote Button'},
      showHeat: {class: 'heat-button', text: 'Show Heat'}
    }
    var props = {
      className: 'vjs-' + buttonProperties[buttonType].class + ' vjs-control',
      innerHTML: '<div class="vjs-control-content"><span class="vjs-control-text">' + buttonProperties[buttonType].text + '</span></div>',
      role: 'button',
      'aria-live': 'polite' 
    };
    return videojs.Component.prototype.createEl(null, props);
  },

  createShowHeatPlugin: function(){
    var options = { 'el' : this.createButton('showHeat') };
    videojs.plugin('showHeatButton', function() {
      var showHeatButton = new videojs.CreateShowHeat(this, options);
      this.controlBar.el().appendChild(showHeatButton.el());
    });
  },

  createUpVotePlugin: function(){
    var options = { 'el' : this.createButton('upVote') };
    videojs.plugin('upVoteButton', function() {
      var upVoteButton = new videojs.CreateUpVote(this, options);
      this.controlBar.el().appendChild(upVoteButton.el());
    });
  },

  createDownVotePlugin: function(){
    var options = { 'el' : this.createButton('downVote') };
    videojs.plugin('downVoteButton', function() {
      var downVoteButton = new videojs.CreateDownVote(this, options);
      this.controlBar.el().appendChild(downVoteButton.el());
    });
  },

  createPlugins: function(){
    this.createShowHeatPlugin();
    this.createUpVotePlugin();
    this.createDownVotePlugin();
  },

  createVideo: function(){
    videojs(this.id, {
      plugins : { 
        showHeatButton : {},
        upVoteButton : {},
        downVoteButton: {}
      }
    });
  },

  createVote: function (e) {
    e.preventDefault();
    var id = this.model.id;
    var timeStamp = this.model.player.getCurrentTime();
    var type = $(e.target).data('vote');
    var vote = type === 'dislike' ? -1 : 1;


    this.model.attributes.votes.create({
      video_id: id,
      timestamp: timeStamp,
      vote: vote
    });
  },

  createHeatmap: function(width, numSeconds, videoID){
    var height = 25;
    var secondWidth = width/numSeconds;

    d3.json('/votes/'+ videoID, function(json) {
      var total = d3.nest()
        .rollup(function(d){
          return d.length;
        })
        .entries(json);

      var data = d3.nest()
        .key(function(d) { return d.timestamp; })
        .sortKeys(d3.ascending)
        .rollup(function(d){
          return (d3.mean(d,function(g) { return +g.vote;}) * ((d.length/total) * 10));
        })
        .entries(json);

      var colorScale = d3.scale.linear()
          .domain([-1, 0, 1])
          .range(["red", "purple", "blue"]);

      var svg = d3.select("#video-" + videoID).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

      var heatMap = svg.selectAll(".second")
        .data(data)
        .enter().append("rect")
        .attr("x", function(d) { return (+d.key-1) * secondWidth; })
        .attr("y", 0)
        .attr("width", secondWidth+1)
        .attr("height", height);

      heatMap.style("fill", function(d) {
        return colorScale(d.values);
      });
    });
  },

  toggleHeatmap: function(e){
    console.log("HI");
    e.preventDefault();

    // this.$el.find("#video-" + this.model.id).toggleClass('hidden');
  }
});