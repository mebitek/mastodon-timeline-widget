/**
 * Mastodon User Timeline Widget
 * Copyright (c) 2017 有限会社アゼット
 * ライセンスに関して、LICENSEファイルを参照下さい。
 * see license file for details.
 *
 * @author Azet <http://www.azet.jp>
 * @version 1.07 (also update MastodonAPI.version below)
 * @param object params_
 *    instance_uri    : the instance to fetch messages from
 *    access_token    : widget's application access token (can be generated from http://www.azet.jp/mastodon.wizard/wizard_en.html)
 *    account_id      : user account id to fetch messages of
 *    target_selector : HTML node selector (jquery/css style)
 *    toots_limit     : max toots display count (default 20 like API)
 */

/* constructor >>> */
var MastodonApi = function(params_) {

	// endpoint access settings
	this.INSTANCE_URI        = params_.instance_uri;
	this.ACCESS_TOKEN        = params_.access_token;
	this.ACCOUNT_ID          = params_.account_id;
	// optional parameters
	this.toots_limit         = params_.toots_limit || 20;
	this.picIcon             = params_.pic_icon || '[PICTURE]';
	this.boostsCountIcon     = params_.boosts_count_icon || '[Boost]';
	this.favouritesCountIcon = params_.favourites_count_icon || '[Favourite]';

	// display target element
	this.widget = jQuery(params_.target_selector);

	// build the basic widget
	this.makeWidget();
	this.listStatuses();

	// spoiler toggle
	// jQuery event handler
	var toggleSpoiler = function(e_) {
		e_.preventDefault();

		// btn text
		if( jQuery(this).hasClass('spoiler-opened') ) {
			jQuery(this).text(MastodonApi.text.spoilerBtnClosed);
		}
		else {
			jQuery(this).text(MastodonApi.text.spoilerBtnOpened);
		}
		jQuery(this).toggleClass('spoiler-opened');

		// open body
		jQuery(this).parent().next('.spoiler-body').toggle();

	};


	// nsfw toggle
	// jQuery event handler
	var toggleNsfwMedia = function(e_) {
		e_.preventDefault();

		if(jQuery(this).hasClass('nsfw-opened')) {
			// hide image ===
			jQuery(this).css({
				'background' : 'black'
			})
			.text(MastodonApi.text.nsfwViewMsg)
			.removeClass('nsfw-opened');
		}
		else {
			// display image ===
			var img = jQuery(this).attr('data-picpreview-url');
			jQuery(this).css({
				'background'       : 'url('+img+') center center no-repeat'
				,'background-size' : 'cover'
			})
			.text('')
			.addClass('nsfw-opened');
		}

	}


	/**
	 * toggle the display of pictures in a modal-ish fashion
	 *
	 * @author Azet
	 * @param jquery_event e_
	 */
	var toggleMedia = function(e_) {
		e_.preventDefault();

		var link = jQuery(this).attr('href');
		var filter = makeFilter();
		var pic = jQuery('<div class="toot-media-zoom" style="background: url('+link+') 50% 50% no-repeat; background-size: contain;"></div>');
		filter.append(pic);
	};


	var makeFilter = function() {
		var filter = jQuery('<div class="toot-media-filter"></div>');
		filter.click(function(e_) {
			e_.preventDefault();
			jQuery(this).remove();
		});
		jQuery('body').append(filter);
		return filter;
	}


	// spoiler buttons events
	this.widget.on('click', '.btn-spoiler', toggleSpoiler);

	// hidden media display toggle
	this.widget.on('click', '.toot-media-nsfw', toggleNsfwMedia);

	// clicks on media icon links
	this.widget.on('click', '.toot-media-link', toggleMedia);
}
/* <<< end constructor */


/* widget Attributes >>> */
MastodonApi.build = 7;        // later for version comparisons if needed
MastodonApi.version = "1.07"; // display
/* <<< */


/* texts >>> */
MastodonApi.text = {
	spoilerBtnClosed  : "Show more"
	,spoilerBtnOpened : "Show less"
	,nsfwLabel        : "NSFW"
	,nsfwViewMsg      : "Click to view"
	,title						: "Latest toots..."
	,byAuthor					: "by"
	,loading					: "loading..."
	,error 						: "ERROR"
	,viewOn						: "View on"
};
/* <<< */


/**
 * build timeline widget
 */
MastodonApi.prototype.makeWidget = function() {
	this.widget.addClass('mastodon-timeline');
	this.widget.append(jQuery('<div class="mt-header"><h4>'+MastodonApi.text.title+'</h4></div>'));
	this.widget.append(jQuery('<div class="mt-body"><div class="mt-loading">'+MastodonApi.text.loading+'</div></div>'));
	this.widget.append(jQuery('<div class="mt-footer"></div>'));
};


/**
 * listing function
 */
MastodonApi.prototype.listStatuses = function() {
	var mapi = this;

	// get request
	jQuery.ajax({
		url: this.INSTANCE_URI+'/api/v1/accounts/'+this.ACCOUNT_ID+'/statuses'
		,headers: {
			Authorization : 'Bearer '+this.ACCESS_TOKEN
		}
		,method : 'GET'
		,dataType: 'json'
		,data : {
			limit : this.toots_limit
		}
		,success: function(data_) {
			// clear the loading message
			jQuery('.mt-body', mapi.widget).html("");
			//console.log( data_ );

			// add posts
			for(var i in data_) {
				if(i==0) {
					// update user link only at first post
					var account = data_[i].account;
					setHeaderUserLink.call(mapi, account);
					setFooterLink.call(mapi, account);
				}
				if(data_[i].visibility=='public') {
					// list only public toots
					appendStatus.call(mapi, data_[i]);
				}
			}

			// fix content link target
			jQuery('a', mapi.widget).attr('target', '_blank');
		}
		,error: function(d_) {
			//console.log( d_ );
			if(d_.responseJSON) {
				jQuery('.mt-header', mapi.widget).html(MastodonApi.text.error);
				jQuery('.mt-body', mapi.widget).html( '<div class="mt-error">' + d_.responseJSON.error + '</div>');
			}
		}
	});


	/**
	 * add user link
	 * @param object account_
	 */
	var setHeaderUserLink = function(account_) {
		// set user name and link
		jQuery('.user-link', this.widget).append("<a href='"+account_.url+"'>@"+account_.username+"</a>");
	};


	/**
	 * add user link
	 * @param object account_
	 */
	var setFooterLink = function(account_) {
		var domain = this.INSTANCE_URI.replace(/https?:\/\//, '');
		jQuery('.mt-footer', this.widget).append(MastodonApi.text.viewOn+" <a href='"+account_.url+"'>"+domain+"</a>");
	};


	/**
	 * inner function to add each message in container
	 * @param object status_
	 */
	var appendStatus = function(status_) {
		//console.log( status_ );
		var content;
		var iframe;
		var date, url, avatar, user, medias, sensitive;

		// dealing with spoiler content
		if(status_.spoiler_text != "") {
			// handle spoilers
			//content.wrap('<div class="spoiler"></div>');
			content = jQuery(
				'<div class="spoiler-header">'+status_.spoiler_text+'<a class="btn-spoiler" href="#open-spoiler">'+MastodonApi.text.spoilerBtnClosed+'</a></div>'+
				'<div class="spoiler-body toot-text">'+status_.content+'</div>' +
				'<div class="toot-medias"></div>'
			);
		}
		else {
			content = jQuery("<div class='toot-text'>" + status_.content + "</div>" + "<div class='toot-medias'></div>");
			
			if (status_.card!=null) {
			    if (status_.card.html!= null && status_.card.html!="") {
    			    iframe = jQuery("<div class='toot-iframe embed-responsive embed-responsive-16by9'>"+status_.card.html+"</div>");
			    } else if (status_.card.image!=null){
			        iframe = jQuery("<div class='toot-image'><img class='img-responsive' src='"+status_.card.image+"'</img></div>");
			    }
			}
		}

		if(status_.reblog) {
			// data from BOOSTED status

			// toot date
			date = prepareDateDisplay(status_.reblog.created_at);

			// toot url
			url = status_.reblog.url;

			// boosted avatar
			avatar = jQuery("<div class='mt-avatar mt-avatar-boosted'></div>");
			avatar.css(makeAvatarCss(status_.reblog.account.avatar));

			// booster avatar
			var boosterAvatar = jQuery("<div class='mt-avatar mt-avatar-booster'></div>");
			boosterAvatar.css(makeAvatarCss(status_.account.avatar));
			avatar.append(boosterAvatar);

			// user name and url
			user = jQuery("<div class='mt-user'><a href='"+status_.reblog.account.url+"'>"+status_.reblog.account.username+"</a></div>");

			// media attachments from original toot
			medias = status_.reblog.media_attachments;

			// original toot's sensitivity
			sensitive = status_.reblog.sensitive;
			content = jQuery("<div class='toot-text'>" + status_.reblog.content + "</div>" + "<div class='toot-medias'></div><div class='toot-iframe'></div>");
			if (status_.reblog.card!=null) {
			    if (status_.reblog.card.html!= null && status_.reblog.card.html!="") {
    			    iframe = jQuery("<div class='toot-iframe embed-responsive embed-responsive-16by9'>"+status_.reblog.card.html+"</div>");
			    } else if (status_.reblog.card.image!=null) {
			        iframe = jQuery("<div class='toot-image'><img class='img-responsive' src='"+status_.reblog.card.image+"'</img></div>");
			    }
			}

		}
		else {
			// data from status

			// toot date
			date = prepareDateDisplay(status_.created_at);

			// toot url
			url = status_.url;

			// avatar
			avatar = jQuery("<div class='mt-avatar'></div>");
			avatar.css(makeAvatarCss(status_.account.avatar));

			// user name and url
			user = jQuery("<div class='mt-user'><a href='"+status_.account.url+"'>"+status_.account.username+"</a></div>");

			// media attachments from this toot
			medias = status_.media_attachments;

			// this toot's sensitivity
			sensitive = status_.sensitive;
		}

		// format date
		var timestamp = jQuery("<div class='mt-date'><a href='"+url+"'>" + date + "</a></div>");

		// sensitive content
		if(sensitive) {
			timestamp.prepend('<span class="nsfw">' + MastodonApi.text.nsfwLabel + '</span>');
		}

		// status container
		var toot = jQuery("<div class='mt-toot'></div>");

		// add to HTML

		if(status_.reblog) {
			toot.append("<div class='toot-retoot'>"+ this.boostsCountIcon +"</div>");
		}

		toot.append( avatar );
		toot.append( user );
		toot.append( timestamp );
		toot.append( content );
		toot.append( iframe );
		jQuery('.mt-body', this.widget).append(toot);

		// media attachments? >>>
		if(medias && medias.length>0) {
			var pic;
			for(var picid in medias) {
				pic = this.replaceMedias(content, medias[picid], sensitive);
				toot.append( pic );
			}
		}
		// <<<

		// stats (boosts + favourites counts) >>>
		// data
		var boostsCountIcon     = '<span class="toot-status-boosts">'     + this.boostsCountIcon     +":"+ status_.reblogs_count    + '</span>';
		var favouritesCountIcon = '<span class="toot-status-favourites">' + this.favouritesCountIcon +":"+ status_.favourites_count + '</span>';

		// html nodes
		var statusBar = jQuery('<div class="toot-status">' +
			boostsCountIcon +
			favouritesCountIcon +
			'</div>');

		toot.append( statusBar );
		// <<<
	};


	/**
	 * display toot time
	 *
	 * @author Azet
	 * @param StringDate date_ (standard time format)
	 * @return String
	 */
	var prepareDateDisplay = function(date_) {
		var displayTime = "";

		//var now  = new Date();
		var date = new Date( date_ );

		displayTime = date.getFullYear()
			+"/"+(date.getMonth()+1)
			+"/"+date.getDate()
			+" "+date.getHours()
			+":"+("0"+date.getMinutes()).replace(/0(\d{2})/, "$1")
		;

		return displayTime;
	};


	/**
	 * simple method that sets CSS attributes for the avatar
	 * @param string avatar_ url of the avatar picture to apply
	 * @return object css properties to apply with jQuery.css method
	 */
	var makeAvatarCss = function(avatar_) {
		return {
			'background' : "white url('"+avatar_+"') 50% 50% no-repeat"
			,'background-size' : 'contain'
		};
	};

};


/**
 * replace media (pictures) in text with an icon and appends a preview
 *
 * @author Azet
 * @param jquery_object content
 * @param object media_ (received with toot's JSON data)
 * @param bool nsfw_ indicates the media is not to be displayed
 * @return object modifier content object
 */
MastodonApi.prototype.replaceMedias = function(content, media_, nsfw_) {
	var nsfw = nsfw_ || false;

	// icon in place of link in content
	var icon = '<a href="'+media_.url+'" class="toot-media-link" target="_blank">'+this.picIcon+'</a>';
	jQuery('a[href="'+media_.text_url+'"]', content).replaceWith(icon);

	if(nsfw) {
		// pics hidden
		var pic = '<div class="toot-media-preview toot-media-nsfw" style="background:black;" data-picpreview-url="'+media_.preview_url+'">' +
			MastodonApi.text.nsfwViewMsg +
			'</div>';
	}
	else {
		// pics visible
		var pic = '<a href="'+media_.url+'"><div class="toot-media-preview" style="background-image:url('+media_.preview_url+');"></div></a>';
	}

	return pic;
};