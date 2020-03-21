class Store {
    constructor(bcApi) {
        this.bcApi = bcApi;
        this.data = {
            whoami: {},
            room: {},
            roomOccupants: [],
        };
        this.listen();
    }

    listen() {
        this.bcApi.rx.on('whoami', eventData => {
            this.data.whoami = eventData.user
        });
        this.bcApi.rx.on('joinRoom', eventData => {
            this.data.room = eventData.room;
            this.bcApi.tx('reloadRoomOccupancy', {roomId: this.data.room.id});
        });
        this.bcApi.rx.on('roomOccupancy', eventData => {
            this.data.roomOccupants = eventData.occupants;
            console.log('roomOccupancy', this.data.roomOccupants);
        });
    }
}

module.exports = Store;
