# WebSocket

逻辑原理步骤：

1、客户端发送一条消息；

2、消息被广播到所有其他连接的客户端,因此,消息是通过 WebSocket 进行交换的；

3、消息是双向发送的；

4、服务器处理所有的客户端和用户。

> WebSocket是什么？

WebSocket是HTML5的下一种协议

他是一个新的基于TCP的应用层协议，只需要一次连接，以后的数据不需要重新进行连接，可以直接进行发送，他是基于TCP的，属于和HTTP相同的地位。

![image-20201118094402769](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20201118094402769.png)

它的最大特点就是服务器可以主动的向客户端推送消息，客户端也可以主动的向服务器发送消息，是真正的双向平等对话，属于服务器推送技术的一种。

>WebSocket的特点

- 建立在TCP协议之上，服务器端的实现比较容易。
- 与HTTP协议有着良好的兼容性，默认端口也是80和443，而且握手阶段采用的也是HTTP协议，因此握手时不容易屏蔽，能通过各种HTTP代理服务器。
- 数据格式比较轻量，性能开销小，通信高效。
- 可以发送文本，也可以发送二进制数据。
- 没有同源限制，客户端可以与任意服务器通信。
- 协议标识符是ws（如果加密，则为wss），服务器网址就是URL。

> WebSocket的优势

1. 是真正的全双工方式，建立连接后客户端与服务器端是完全平等的，可以互相主动请求。HTTP长连接基于HTTP，是传统的客户端对服务器发起请求的模式。
2. HTTP长连接中，每次数据交换除了真正的数据部分以外，服务端和客户端还要大量交换HTTP header，信息交换效率很低。WebSocket协议通过第一个request建立连接以后，之后交换的数据都不需要发送HTTP header就能交换数据，这显然和原有的HTTP协议有区别所以它需要对服务器和客户端都进行升级才能实现（主流的浏览器都已经支持HTML5）

> WebSocket实例

后台消息推送是很多系统中重要的功能，例如在网管项目中，当网管服务器收到设备发来的告警的时候，需要将告警信息推送到客户端，这里面就用到了消息推送。

之前网管的推送是使用flash进行实现的，但flash经常出现被禁用等问题，导致客户端收不到服务器推送来的消息，加上很多浏览器对flash已经不再进行更新，了解了WebSocket的优势后，于是将后台的消息推送用WebSocket实现。

服务端对WebSocket技术的实现：

1. Kaazing WebSocket Gateway(一个 Java 实现的 WebSocket Server)；
2. mod_pywebsocket(一个 Python 实现的 WebSocket Server)；
3. Netty(一个 Java 实现的网络框架其中包括了对 WebSocket 的支持)；
4. node.js(一个 Server 端的 JavaScript 框架提供了对 WebSocket 的支持)；
5. WebSocket4Net(一个.net的服务器端实现)；