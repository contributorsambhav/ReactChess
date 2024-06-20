mongoose.connect('mongodb+srv://sam:Password@atlascluster.ycaagz6.mongodb.net/Chess?retryWrites=true&w=majority&appName=AtlasCluster', {
     useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false 
    }
).then(() => console.log('MongoDB connected')).catch((err)=>{
    console.log(err);
})