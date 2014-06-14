$(document).ready(function(){
	var width=$(window).width();
	var height=900;
	if(width<640){
		height=900*width/640;
	}
	$(".main").height(height);

	//event listener
	$("#new_game_btn").click(function(){
		$(".enter-view").hide();
		$(".first-view").show();
	});

	$("#submit_id_btn").click(function(){
		$(".first-view").hide();
		$(".select-team-view").show();
	});

	$("#team_red_btn").click(function(){
		$(".select-team-view").hide();
		$(".imformation-view").show();
	});

});

