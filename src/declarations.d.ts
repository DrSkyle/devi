
declare module 'y-webrtc' {
  import { Doc } from 'yjs'
  export class WebrtcProvider {
    constructor(roomName: string, doc: Doc, opts?: any)
    awareness: any
    destroy(): void
  }
}

declare module 'y-indexeddb' {
  import { Doc } from 'yjs'
  export class IndexeddbPersistence {
    constructor(name: string, doc: Doc)
    on(event: string, cb: Function): void
  }
}
