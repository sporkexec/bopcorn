module.exports = {
    // TODO version: 1, migrations, etc
    tableStatements: [
`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    /* authn, appearance */
    guestExpiryUnixtime INTEGER
)`,
`CREATE TABLE rooms (
    id INTEGER PRIMARY KEY,
    name TEXT
    /*
    isOpenInvites bool
    djSeatCount int
    djSeatQueueModel enum(free, queue, lottery)
    djVenueOverrideEnabled bool
    default appearance/venue
    */
)`,
`CREATE TABLE roomRoles (
    roomId INTEGER,
    userId INTEGER,
    role TEXT, /* creator, moderator, inviter */
    PRIMARY KEY(roomId, userId)
)`,
`CREATE TABLE roomOccupants (
    roomId INTEGER,
    userId INTEGER,
    djSeatOccupied INTEGER,
    inactivityExpiryUnixtime INTEGER,
    /* position/etc for whatever fun ui */
    PRIMARY KEY(roomId, userId)
)`,
`CREATE TABLE queueItems (
    id INTEGER PRIMARY KEY,
    roomId INTEGER,
    playlistIndex INTEGER,
    /* mediaType enum(music/movie/tv/youtube) */
    queuerUserId INTEGER,
    expiryUnixtime INTEGER,

    /* user supplied, cannot be verified */
    contentUri TEXT, /* hash/torrent/link */
    duration INTEGER,
    filesize INTEGER,
    title TEXT,
    artist TEXT
)`,
`CREATE TABLE mediaStates (
    roomId INTEGER PRIMARY KEY,
    state TEXT, /* playing, paused, loading, idle? */
    queueItemId INTEGER,
    lastKnownPlaybackPosition INTEGER,
    lastKnownUnixtime INTEGER
)`,
`CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    roomId INTEGER,
    userId INTEGER,
    creationUnixtime INTEGER,
    queueItemId INTEGER,
    content TEXT
)`,
    ]
}
