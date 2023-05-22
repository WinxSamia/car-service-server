const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json())


console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);

function verifyJ(req, res, next) {
    const authorizedToken = req.headers.authorization;
    if (!authorizedToken) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    else {
        const userToken = authorizedToken.split(' ')[1];
        jwt.verify(userToken, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
            if (err) {
                return res.status(401).send({ message: 'Unauthorized access' });
            }
            req.decoded = decoded;
            next();
        })
    }
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.s25wj1i.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const serviceCollection = client.db('Car_service').collection('services');
        const orderCollection = client.db('Car_service').collection('order');

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const service = await cursor.toArray();
            res.send(service);

        });
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        app.post('/orders', verifyJ, async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        app.get('/orders', verifyJ, async (req, res) => {
            const decoded = req.decoded;
            console.log('The decode:', decoded);
            if (decoded.email !== req.query.email) {
                return res.status(403).send({ message: 'Forbidden access' })
            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }

            }
            const result = orderCollection.find(query);
            const orders = await result.toArray();
            res.send(orders);
        });

        app.post('/token', (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token });
        })

    }
    finally {

    }

}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('HIIIIIIIIII');
})

app.delete('/orders/:id', verifyJ, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await orderCollection.deleteOne(query);
    res.send(result);

})

app.listen(port, () => {
    console.log('Runnnningggggggggg');
})