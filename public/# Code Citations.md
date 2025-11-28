# Code Citations

## License: unknown
https://github.com/mimcmahon20/GrowOrGo/tree/64cc63413d4e7eab3fe30e4768b4830e43cf8472/backend/config/db.js

```
= async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database
```

