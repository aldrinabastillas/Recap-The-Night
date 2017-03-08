# [Recap-the-Night](http://aldrinabastillas.com/#!/Recap)#
Given an artist or venue, search shows in [setlist.fm](setlist.fm) and create a Spotify playlist of the concert

### Background
Inspired by a [quote](https://www.fastcompany.com/3065478/the-fast-company-innovation-festival/four-lessons-from-seatgeeks-fan-friendly-assault-on-tic)
about creating digital keepsakes after a live event, I thought of what I do after a great concert, 
which is creating a playlist of the band's setlist.  

### Future Directions
* If there was an endpoint to access a user's attended events through [Seatgeek's API](http://platform.seatgeek.com/), there
wouldn't be a need to manually search for the artist or venue
* Search through Instagram for recent media tagged at a [venue](https://www.instagram.com/developer/endpoints/locations/#get_locations_media_recent)
or tagged with the [artist's name](https://www.instagram.com/developer/endpoints/tags/#get_tags_media_recent).

### Notes
* This repo is one of the modules in this [repo](https://github.com/aldrinabastillas/Personal-Site-MEAN/tree/master/Personal-Site-MEAN)
but separated for clarity.
* SeatGeek's A/B testing [framework](https://github.com/seatgeek/sixpack) was used to present two different search workflows, 
either searching by artist or by venue. A user is converted if they reached the end of the workflow which is to save a 
setlist to a Spotify playlist.
