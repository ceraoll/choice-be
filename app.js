const express = require('express');
const bodyParser = require('body-parser')
const { verify, sign } = require('jsonwebtoken');
const { Brand, Criteria, GenerasiProcessor, KapasitasRam, KapasitasRom, KecepatanRam, Laptop, Resolusi, TipeProcessor, User, NilaiAlternatifLaptop, sequelize} = require('./models/index.js');
const bcrypt = require('bcrypt');
const cors = require('cors');


const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies if needed
}));

app.use(bodyParser.json());

const SECRET_KEY = 'kelompok_3';
const REFRESH_SECRET_KEY = "kelompok_3"

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied, token missing!' });
  }

  const token = authHeader.split(' ')[1]; // Extract token after 'Bearer'
  if (!token) {
    return res.status(401).json({ error: 'Access denied, token missing!' });
  }

  verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token!' });
    }
    req.user = user; // Save decoded token payload in request
    next();
  });
}

app.post('/token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Refresh token is required!' });
  }

  if (!refreshTokens.includes(token)) {
    return res.status(403).json({ error: 'Invalid refresh token!' });
  }

  try {
    const user = verify(token, REFRESH_SECRET_KEY); // Verify refresh token
    const accessToken = generateAccessToken({ user_id: user.user_id, username: user.username });
    res.json({ accessToken });
  } catch (err) {
    console.error('Error refreshing token:', err);
    res.status(403).json({ error: 'Invalid or expired refresh token!' });
  }
});

// Utility function to generate access tokens
function generateAccessToken(user) {
  return sign(user, SECRET_KEY, { expiresIn: '1d' }); // Access token expires in 1 day
}

// Utility function to generate refresh tokens
function generateRefreshToken(user) {
  return sign(user, REFRESH_SECRET_KEY, { expiresIn: '7d' }); // Refresh token expires in 7 days
}

// Route to generate JWT token (for testing purposes)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required!' });
  }

  try {
    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'Invalid username or password!' });
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password!' });
    }

    // Generate JWT token
    const accessToken = generateAccessToken({ user_id: user.user_id, username: user.username });
    const refreshToken = generateRefreshToken({ user_id: user.user_id, username: user.username });

    const userInfo = {
      user_id: user.user_id,
      username: user.username,
    };


    res.json({ accessToken, refreshToken, userInfo });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/check-username', async (req, res) => {
  const { username } = req.query;
  console.log(username)
  const isAvailable = !await User.findOne({ where: { username } });

  if (isAvailable) {
    res.status(200).json({ isAvailable: true });
  } else {
    res.status(200).json({ isAvailable: false });
  }
})

// POST API for creating a new user with hashed password
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required!' });
  }

  

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await User.create({
      username,
      password: hashedPassword,
    });

    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update Password
// PUT API to update user password
app.put('/users/change-password', authenticateToken, async (req, res) => {
  const { user_id } = req.query; // Retrieve user ID from the route parameter
  const { oldPassword, newPassword } = req.body; // Retrieve new password from the request body

  if (parseInt(user_id) !== req.user.user_id) {
    return res.status(403).json({ error: 'You are not authorized to change this password!' });
  }

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing required data!' });
  }

  try {
    // Find the user by ID
    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate the old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ error: 'Invalid old password!' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully!' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});


// POST API for creating a new laptop
app.post('/laptop', authenticateToken, async (req, res) => {
  const {
    user_id,
    nama_laptop,
    harga,
    berat,
    kapasitas_rom,
    kapasitas_ram,
    kecepatan_ram,
    resolusi,
    processor,
  } = req.body;
  

  if (
    !user_id ||
    !nama_laptop ||
    !harga ||
    !berat ||
    !kapasitas_rom ||
    !kapasitas_ram ||
    !kecepatan_ram ||
    !resolusi ||
    !processor
  ) {
    return res.status(400).json({ error: 'All fields are required!' });
  }
  const transaction = await sequelize.transaction();

  try {
    // Insert into `Laptop` table
    const laptop = await Laptop.create(
      {
        user_id,
        nama_laptop,
        harga: harga,
        berat: berat,
        kapasitas_rom: kapasitas_rom.label,
        kapasitas_ram: kapasitas_ram.label,
        kecepatan_ram: kecepatan_ram.label,
        resolusi: resolusi.label,
        processor: processor.label,
      },
      { transaction }
    );

    // Insert into `NilaiAlternatifLaptop` table
    await NilaiAlternatifLaptop.create(
      {
        id_laptop: laptop.id_laptop, // Link with the `Laptop` table
        user_id,
        nama_laptop,
        harga: harga,
        berat: berat,
        kapasitas_rom: kapasitas_rom.value, // Use `value` instead of `label`
        kapasitas_ram: kapasitas_ram.value,
        kecepatan_ram: kecepatan_ram.value,
        resolusi: resolusi.value,
        tipe_processor: processor.value.tipe, // Use `tipe` for the processor
        generasi_processor: processor.value.generasi, // Use `generasi` for the processor
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();
    return res.status(201).json({
      laptop,
    }); // Return the created `Laptop` record
  } catch (error) {
    // Rollback transaction in case of an error
    await transaction.rollback();
    throw error;
  }
});

app.get('/criteria', async(_, res) => {
  try {
    const criteria = await Criteria.findAll();
    res.json(criteria);
  } catch (err) {
    console.error('Error fetching criteria:', err);
    res.status(500).json({ error: 'Failed to fetch criteria data' });
  }
})

// Get all processors with dynamic rescaled_value
app.get('/processors', async (req, res) => {
  const processors = await GenerasiProcessor.findAll();

  // Get ranges for scaling
  const maxIntel = await GenerasiProcessor.max('value', { where: { brand_id: 1 } }); // Max value for Intel
  const maxAMD = await GenerasiProcessor.max('value', { where: { brand_id: 2 } });   // Max value for AMD

  // Map over processors to calculate rescaled_value dynamically
  const processedData = processors.map(proc => {
    let rescaled_value = proc.value;

    // Apply rescaling for AMD
    if (proc.brand_id === 2) {
      rescaled_value = ((proc.value - 1) / (maxAMD - 1)) * (maxIntel - 1) + 1;
    }

    return {
      ...proc.toJSON(),
      rescaled_value, // Add dynamic rescaled_value
    };
  });

  res.json(processedData);
});

function createCriteriaRoute(model, route, filterKeys = []) {
  app.get(route, authenticateToken, async (req, res) => {
    try {
      const where = {};

      // Build the `where` object based on query parameters
      filterKeys.forEach((key) => {
        if (req.query[key]) {
          where[key] = req.query[key];
        }
      });
      

      const results = Object.keys(where).length
        ? await model.findAll({ where }) // Apply filters if present
        : await model.findAll(); // Fetch all records if no filters


      if (results.length === 0) {
        return res.json([]);
      }

      res.json(results);
    } catch (err) {
      console.error(`Error fetching data for ${route}:`, err);
      res.status(500).json({ error: `Failed to fetch data for ${route}` });
    }
  });
}

// Create GET routes for all tables
createCriteriaRoute(Brand, '/brand'); // Filter by id or brand_id
createCriteriaRoute(GenerasiProcessor, '/generasi-processor'); // Filter by id or brand_id
createCriteriaRoute(KapasitasRam, '/kapasitas-ram'); // Filter by id
createCriteriaRoute(KapasitasRom, '/kapasitas-rom'); // Filter by id
createCriteriaRoute(KecepatanRam, '/kecepatan-ram'); // Filter by id
createCriteriaRoute(Resolusi, '/resolusi'); // Filter by id
createCriteriaRoute(TipeProcessor, '/tipe-processor'); // Filter by id or brand_id
createCriteriaRoute(Laptop, '/laptop', ['user_id']);
createCriteriaRoute(NilaiAlternatifLaptop, '/nilai-alternatif-laptop', ['user_id']);


// // GET API for each table
// app.get('/brand', authenticateToken, async (_, res) => {
//   try {
//     const brands = await Brand.findAll();
//     res.json(brands);
//   } catch (err) {
//     console.error('Error fetching brand:', err);
//     res.status(500).json({ error: 'Failed to fetch brand data' });
//   }
// });

// app.get('/criteria', authenticateToken, async (_, res) => {
//   try {
//     const criteria = await Criteria.findAll();
//     res.json(criteria);
//   } catch (err) {
//     console.error('Error fetching criteria:', err);
//     res.status(500).json({ error: 'Failed to fetch criteria data' });
//   }
// });


// // GET specific generasi_processor by ID
// app.get('/generasi_processor', authenticateToken, async (req, res) => {
//   const { id, brand_id } = req.query; // Retrieve query parameters
//   try {
//     let res;

//     if (id || brand_id) {
//       // If `id` or `brand_id` is provided, apply filtering
//       const where = {};
//       if (id) where.id = id; // Filter by id if provided
//       if (brand_id) where.brand_id = brand_id; // Filter by brand_id if provided

//       res = await GenerasiProcessor.findAll({ where });
//       if (res.length === 0) {
//         return res.status(404).json({ error: 'No matching generasi_processor found' });
//       }
//     } else {
//       // If no filters, fetch all records
//       res = await GenerasiProcessor.findAll();
//     }

//     res.json(res);
//   } catch (err) {
//     console.error('Error fetching generasi_processor:', err);
//     res.status(500).json({ error: 'Failed to fetch generasi_processor data' });
//   }
// });

// // GET specific laptop by ID
// app.get('/laptop/:id', authenticateToken, async (req, res) => {
//   const { id } = req.params;
//   try {
//     const laptop = await Laptop.findByPk(id);
//     if (!laptop) {
//       return res.status(404).json({ error: 'Laptop not found' });
//     }
//     res.json(laptop);
//   } catch (err) {
//     console.error('Error fetching laptop:', err);
//     res.status(500).json({ error: 'Failed to fetch laptop data' });
//   }
// });

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
