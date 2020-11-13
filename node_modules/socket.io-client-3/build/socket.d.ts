import Emitter = require("component-emitter");
import { Manager } from "./manager";
export interface SocketOptions {
    /**
     * the authentication payload sent when connecting to the Namespace
     */
    auth: object | ((cb: (data: object) => void) => void);
}
export declare class Socket extends Emitter {
    readonly io: Manager;
    id: string;
    connected: boolean;
    disconnected: boolean;
    private readonly nsp;
    private readonly auth;
    private ids;
    private acks;
    private receiveBuffer;
    private sendBuffer;
    private flags;
    private subs;
    private _anyListeners;
    /**
     * `Socket` constructor.
     *
     * @public
     */
    constructor(io: Manager, nsp: string, opts?: Partial<SocketOptions>);
    /**
     * Subscribe to open, close and packet events
     *
     * @private
     */
    private subEvents;
    /**
     * "Opens" the socket.
     *
     * @public
     */
    connect(): Socket;
    /**
     * Alias for connect()
     */
    open(): Socket;
    /**
     * Sends a `message` event.
     *
     * @return {Socket} self
     * @public
     */
    send(...args: any[]): this;
    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @param {String} ev - event name
     * @return {Socket} self
     * @public
     */
    emit(ev: string, ...args: any[]): this;
    /**
     * Sends a packet.
     *
     * @param {Object} packet
     * @private
     */
    private packet;
    /**
     * Called upon engine `open`.
     *
     * @private
     */
    private onopen;
    /**
     * Called upon engine `close`.
     *
     * @param {String} reason
     * @private
     */
    private onclose;
    /**
     * Called with socket packet.
     *
     * @param {Object} packet
     * @private
     */
    private onpacket;
    /**
     * Called upon a server event.
     *
     * @param {Object} packet
     * @private
     */
    private onevent;
    private emitEvent;
    /**
     * Produces an ack callback to emit with an event.
     *
     * @private
     */
    private ack;
    /**
     * Called upon a server acknowlegement.
     *
     * @param {Object} packet
     * @private
     */
    private onack;
    /**
     * Called upon server connect.
     *
     * @private
     */
    private onconnect;
    /**
     * Emit buffered events (received and emitted).
     *
     * @private
     */
    private emitBuffered;
    /**
     * Called upon server disconnect.
     *
     * @private
     */
    private ondisconnect;
    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @private
     */
    private destroy;
    /**
     * Disconnects the socket manually.
     *
     * @return {Socket} self
     * @public
     */
    disconnect(): Socket;
    /**
     * Alias for disconnect()
     *
     * @return {Socket} self
     * @public
     */
    close(): Socket;
    /**
     * Sets the compress flag.
     *
     * @param {Boolean} compress - if `true`, compresses the sending data
     * @return {Socket} self
     * @public
     */
    compress(compress: boolean): this;
    /**
     * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
     * ready to send messages.
     *
     * @returns {Socket} self
     * @public
     */
    get volatile(): Socket;
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * @param listener
     * @public
     */
    onAny(listener: (...args: any[]) => void): Socket;
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * @param listener
     * @public
     */
    prependAny(listener: (...args: any[]) => void): Socket;
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @param listener
     * @public
     */
    offAny(listener?: (...args: any[]) => void): Socket;
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     *
     * @public
     */
    listenersAny(): ((...args: any[]) => void)[];
}
