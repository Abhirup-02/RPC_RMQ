const amqplib = require('amqplib')
const { v4: uuid4 } = require('uuid')


let amqplibConnection = null

const getChannel = async () => {
    if (amqplibConnection === null) {
        amqplibConnection = await amqplib.connect('amqp://localhost')
    }
    return await amqplibConnection.createChannel()
}

const expensiveDBOperation = async (payload, fakeResponse) => {
    console.log(payload)
    console.log(fakeResponse)

    return new Promise((res, rej) => {
        setTimeout(() => {
            res(fakeResponse)
        }, 10000)
    })
}

const RPC_Observer = async (RPC_QUEUE_NAME, fakeResponse) => {
    const channel = await getChannel()
    await channel.assertQueue(RPC_QUEUE_NAME, {
        durable: false
    })
    channel.prefetch(1)
    channel.consume(
        RPC_QUEUE_NAME,
        async (msg) => {
            if (msg.content) {
                /* DB operation */
                const payload = JSON.parse(msg.content.toString())
                const response = await expensiveDBOperation(payload, fakeResponse) // Call fake DB operation


                channel.sendToQueue(
                    msg.properties.replyTo,
                    Buffer.from(JSON.stringify(response)),
                    {
                        correlationId: msg.properties.correlationId
                    }
                )
                channel.ack(msg)
            }
        },
        {
            noAck: false
        }
    )
}

const requestData = async (RPC_QUEUE_NAME, requestPayload, uuid) => {

    const channel = await getChannel()

    const Q = await channel.assertQueue("", { exclusive: true })

    channel.sendToQueue(
        RPC_QUEUE_NAME,
        Buffer.from(JSON.stringify(requestPayload)),
        {
            replyTo: Q.queue,
            correlationId: uuid
        }
    )

    return new Promise((resolve, reject) => {
        // Timeout n
        const timeout = setTimeout(() => {
            channel.close()
            resolve('API Timeout')
        }, 8000)


        channel.consume(
            Q.queue,
            (msg) => {
                if (msg.properties.correlationId == uuid) {
                    resolve(JSON.parse(msg.content.toString()))
                    clearTimeout(timeout)
                }
                else {
                    reject('Data not found')
                }
            },
            {
                noAck: true
            }
        )
    })
}


const RPC_Request = async (RPC_QUEUE_NAME, requestPayload) => {

    const uuid = uuid4() // correlationId

    return await requestData(RPC_QUEUE_NAME, requestPayload, uuid)
}


module.exports = { getChannel, RPC_Observer, RPC_Request }