(function () {
    //Public Functions
    exports.parseSetlists = parseSetlists;
    exports.parseSets = parseSets;
    exports.parseVenues = parseVenues;

    //Function Implementations

    /**
     * Parse dates from Setlist.fm into JS format: year, month (0-11), date
     * @param {string} dateString - Dates from setlist.fm are 'DD-MM-YYY'
     */
    function parseDate(dateString) {
        var split = dateString.split('-');
        return new Date(split[2], split[1] - 1, split[0]);
    }; 


    /**
     * Called by setlistModule.getVenueSetlists()
     * @param setlists
     */
    function parseSetlists(setlists) {
        var setlistArr = [];
        setlists.forEach(function (item) {
            setlistArr.push({
                artist: item['artist']['@name'],
                date: parseDate(item['@eventDate']),
                venue: item['venue']['@name'] + ', ' + item['venue']['city']['@name'],
                id: item['@id'],
                sets: item['sets']
            });
        });
        return setlistArr;
    };


    /**
     * Given a sets object, which may have one set object, or an array of sets
     * returns a single array of songs
     * Called by setlistModule.getSetlistSongs()
     * @param {Object} sets - Sets at a single show
     * @param {string} artist
     */
    function parseSets(sets, artist) {
        var songs = [];
        if(!sets){
            return songs;
        }
        
        var sets = JSON.parse(sets);
        var songs = [];
        if (sets.set.length > 0) { //if there is an array of multiple sets
            sets.set.forEach(function (set) {
                songs = songs.concat(parseSingleSet(set, artist));
            });
        }
        else if (sets.set.song.length > 0) { //only one set object, check if there are songs
            songs = parseSingleSet(sets.set, artist);
        }
        return songs;
    };


    /**
     * Given a set of songs, return an array of objects that just has
     * the song name and artist. If the song is not a cover, use the
     * provided artist
     * @param {Object} set -
     * @param {string} artist - 
     */
    function parseSingleSet(set, artist) {
        var songs = [];
        if (set.song.length > 0) {
            set.song.forEach(function (song) {
                var songArtist = (song.cover && song.cover['@name']) ? song.cover['@name'] : artist;
                songs.push({
                    name: song['@name'],
                    artist: songArtist,
                });
            });
        }
        return songs;
    };


    /**
     * Caled by parseVenues()
     * @param {Object} venue 
     */
    function parseVenue(venue) {
        var city = venue['city']['@name'];
        var country = venue['city']['country']['@name']
        var description = (country) ? city + ', ' + country : city;
        return {
            id: venue['@id'],
            title: venue['@name'],
            description: description
        };
    };


    /**
     * 
     * @param {Object} venues 
     */
    function parseVenues(venues) {
        var venueArr = [];

        if (venues.length > 0) {
            venues.forEach(function (venue) {
                venueArr.push(parseVenue(venue));
            });
        } else {
            venueArr.push(parseVenue(venues));
        }

        return venueArr;
    };

})();