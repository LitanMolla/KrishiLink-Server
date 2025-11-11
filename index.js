const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors())
app.use(express.json());
require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.gwlvspd.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
app.get('/', (req, res) => {
    res.send('Hello World!')
})
const run = async () => {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        const KrishiLink = client.db("KrishiLink");
        const cropsCollection = KrishiLink.collection("crops");
        app.post('/crops', async (req, res) => {
            const newCrop = req.body;
            const result = await cropsCollection.insertOne(newCrop)
            res.send(result)
        })
        app.get('/latest', async (req, res) => {
            const result = await cropsCollection.find().sort({ createdAt: -1 }).limit(6).toArray()
            res.send(result)
        })
        app.get('/crops', async (req, res) => {
            const search = req.query.search || '';
            const result = await cropsCollection.find({ name: { $regex: search, $options: 'i' } }).toArray()
            res.send(result)
        })
        app.get('/my-crops', async (req, res) => {
            const email = req.query.email;
            const query = { ['owner.ownerEmail']: email }
            if (!email) {
                return res.send({ message: 'Email missing' })
            }
            const result = await cropsCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/crops/:id', async (req, res) => {
            const id = req.params.id;
            const result = await cropsCollection.find({ _id: new ObjectId(id) }).toArray()
            res.send(result)
        })
        app.post('/interests/:id', async (req, res) => {
            const query = req.params.id;
            const newInterest = req.body;
            newInterest._id = new ObjectId()
            const result = await cropsCollection.updateOne({ _id: new ObjectId(query) }, { $push: { interests: newInterest } })
            res.send(result)
        })
        app.post('/add', async (req, res) => {
            const newCrop = req.body;
            result = await cropsCollection.insertOne(newCrop)
            res.send(result)
        })
        app.get('/interests/:email', async (req, res) => {
            const email = req.params.email;
            const result = await cropsCollection.aggregate([{ $unwind: "$interests" }, { $match: { "interests.userEmail": email } }, { $addFields: { quantity: { $toInt: "$interests.quantity" } } }, { $project: { _id: 0, cropId: "$_id", cropName: "$name", ownerName: "$owner.ownerName", quantity: 1, message: "$interests.message", status: "$interests.status" } }, { $sort: { quantity: -1 } }]).toArray();
            res.send(result);
        })
        app.patch('/my-crops/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) };
            const updatedData = req.body;
            const update = { $set: updatedData }
            const result = await cropsCollection.updateOne(query, update)
            res.send(result)
        })
        app.delete('/my-crops/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cropsCollection.deleteOne(query)
            res.send(result)
        })
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
