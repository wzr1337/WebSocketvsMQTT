# WebSockets vs MQTT

This tool is made to evaluate MQTT vs WebSocket

## Architecture

A HTML5 application sends messages to and echo server / broker. The nunmber of messages and the total travel time is measured. For evaluation, the messages travel time is devided into half to calculate the "server 2 client latency" for WebSockets. 

### parties involved

As per design the MQTT service will always hav a broker between client and service, the traveltime must not be devided into half.

### Compression

While WebSockets support compression on protofol level (per-message-deflate), the client must compress the payload before sending it (application level) in the MQTT case.

## Tests

JSON payload serialized

```
throughput MByte/s with compression
  package size 100 Byte / 1kB / 10kB / 128kB
throughput MByte/s without compression
  package size 100 Byte / 1kB / 10kB / 128kB
latency ms with compression
  package size 100 Byte / 1kB / 10kB / 128kB
latency ms without compression
  package size 100 Byte / 1kB / 10kB / 128kB
bandwidth consumed MByte/1000msg with compression (incl. protocol layer overhead)
  package size 100 Byte / 1kB / 10kB / 128kB
bandwidth consumed MByte/1000msg compression (incl. protocol layer overhead)
  package size 100 Byte / 1kB / 10kB / 128kB
```


| protocol   | throughput msg/s with compression  |   |   |   |
|------------|---|---|---|---|
| MQTT       |   |   |   |   |
| WebSockets |   |   |   |   |

