import EscPosEncoder from 'esc-pos-encoder'

// Basic type definitions for Web Serial API
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>
  writable: WritableStream<Uint8Array> | null
  close(): Promise<void>
}

interface NavigatorWithSerial extends Navigator {
  serial: {
    requestPort(): Promise<SerialPort>
  }
}

export const printerService = {
  port: null as SerialPort | null,

  async connect() {
    const nav = navigator as unknown as NavigatorWithSerial
    if (!nav.serial) {
      alert("Your browser doesn't support Web Serial. Use Chrome or Edge.")
      return
    }
    // Request user to select the printer (only needed once per session)
    this.port = await nav.serial.requestPort()
    await this.port.open({ baudRate: 9600 })
  },

  async printReceipt(
    pharmacyName: string,
    saleData: { items: any[]; total: number; billNumber: string; date: string },
  ) {
    if (!this.port) await this.connect()
    if (!this.port) return // User cancelled or failed

    const encoder = new EscPosEncoder()

    // Build the Receipt
    let result = encoder
      .initialize()
      .align('center')
      .bold(true)
      .line(pharmacyName)
      .bold(false)
      .line('--------------------------------')
      .align('left')

    // Add Items
    saleData.items.forEach((item: any) => {
      result.line(`${item.name}`)
      result.line(`  ${item.qty} x ${item.price} = ${item.total}`)
    })

    result
      .line('--------------------------------')
      .align('right')
      .line(`TOTAL: Rs. ${saleData.total}`)
      .newline()
      .align('center')
      .line(`Bill No: ${saleData.billNumber}`)
      .line(saleData.date)
      .newline()
      .newline()
      .cut()
      .encode()

    // Send raw bytes to printer
    const writer = this.port.writable!.getWriter()
    await writer.write(result)
    writer.releaseLock()
  },
}
