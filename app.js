const express = require('express');
const bodyParser = require('body-parser')
const { verify, sign } = require('jsonwebtoken');
const { Brand, Criteria, GenerasiProcessor, KapasitasRam, KapasitasRom, KecepatanRam, Laptop, Resolusi, TipeProcessor, Users, NilaiAlternatifLaptop, sequelize} = require('./models/index.js');
const bcrypt = require('bcrypt');
const cors = require('cors');


const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'https://backend.sawchoice.site', 'https://sawchoice.site'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true,
}));

app.use(bodyParser.json());

const SECRET_KEY = 'kelompok_3';
const REFRESH_SECRET_KEY = "kelompok_3"

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied, token missing!' });
  }

  const token = authHeader.split(' ')[1]; 
  if (!token) {
    return res.status(401).json({ error: 'Access denied, token missing!' });
  }

  verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token!' });
    }
    req.user = user; 
    next();
  });
}

app.post('/token', (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Refresh token is required!' });
  }

  if (!refreshTokens.includes(token)) {
    return res.status(403).json({ error: 'Invalid refresh token!' });
  }

  try {
    const user = verify(token, REFRESH_SECRET_KEY);
    const accessToken = generateAccessToken({ user_id: user.user_id, username: user.username });
    res.json({ accessToken });
  } catch (err) {
    console.error('Error refreshing token:', err);
    res.status(403).json({ error: 'Invalid or expired refresh token!' });
  }
});

function generateAccessToken(user) {
  return sign(user, SECRET_KEY, { expiresIn: '1d' });
}

function generateRefreshToken(user) {
  return sign(user, REFRESH_SECRET_KEY, { expiresIn: '7d' }); 
}

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Masukan username atau Password!' });
  }

  try {
    const user = await Users.findOne({ where: { username } });
    if (!user) {
      return res.status(403).json({ error: 'Invalid credentials!' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(403).json({ error: 'Invalid credentials!' });
    }

    const accessToken = generateAccessToken({ user_id: user.user_id, username: user.username });
    const refreshToken = generateRefreshToken({ user_id: user.user_id, username: user.username });

    const userInfo = {
      user_id: user.user_id,
      username: user.username,
    };


    res.json({ accessToken, refreshToken, userInfo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/check-username', async (req, res) => {
  const { username } = req.query;
  const isAvailable = !await Users.findOne({ where: { username } });

  if (isAvailable) {
    res.status(200).json({ isAvailable: true });
  } else {
    res.status(200).json({ isAvailable: false });
  }
})

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required!' });
  }

  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await Users.create({
      username,
      password: hashedPassword,
    });

    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/users/change-password', authenticateToken, async (req, res) => {
  const { user_id } = req.query;
  const { oldPassword, newPassword } = req.body;

  if (parseInt(user_id) !== req.user.user_id) {
    return res.status(403).json({ error: 'You are not authorized to change this password!' });
  }

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing required data!' });
  }

  try {
    const user = await Users.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ error: 'Invalid old password!' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully!' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});


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

    await NilaiAlternatifLaptop.create(
      {
        id_laptop: laptop.id_laptop,
        user_id,
        nama_laptop,
        harga: harga,
        berat: berat,
        kapasitas_rom: kapasitas_rom.value, 
        kapasitas_ram: kapasitas_ram.value,
        kecepatan_ram: kecepatan_ram.value,
        resolusi: resolusi.value,
        tipe_processor: processor.value.tipe, 
        generasi_processor: processor.value.generasi,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      laptop,
    });
  } catch (err) {
    await transaction.rollback();
    return err;
  }
});

app.get('/laptop/:id_laptop', authenticateToken, async(req, res) => {
  const { id_laptop } = req.params;

  try {
    const data = await Laptop.findOne({ where: { id_laptop } });
    return res.status(200).json(data)
  } catch (err) {
    console.error('Error fetching id_laptop', err);
    return res.status(500).json({ error: 'An error occurred while fetching laptop by id.' });
  }

});

app.put('/laptop/:id_laptop/update', authenticateToken, async (req, res) => {
  const { id_laptop } = req.params; 
  const {
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
    !id_laptop ||
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
    const laptop = await Laptop.findOne({ where: { id_laptop }, transaction });
    if (!laptop) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Laptop not found!' });
    }

    await Laptop.update(
      {
        nama_laptop,
        harga: harga,
        berat: berat,
        kapasitas_rom: kapasitas_rom.label,
        kapasitas_ram: kapasitas_ram.label,
        kecepatan_ram: kecepatan_ram.label,
        resolusi: resolusi.label,
        processor: processor.label,
      },
      {
        where: { id_laptop },
        transaction, 
      }
    );

    await NilaiAlternatifLaptop.update(
      {
        nama_laptop,
        harga: harga,
        berat: berat,
        kapasitas_rom: kapasitas_rom.value, 
        kapasitas_ram: kapasitas_ram.value,
        kecepatan_ram: kecepatan_ram.value,
        resolusi: resolusi.value,
        tipe_processor: processor.value.tipe, 
        generasi_processor: processor.value.generasi,
      },
      {
        where: { id_laptop },
        transaction, 
      }
    );

    await transaction.commit();

    return res.status(200).json({
      message: 'Laptop and its alternative values updated successfully!',
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Error updating laptop and alternative values:', err);
    return res.status(500).json({ error: 'An error occurred while updating the laptop and its alternative values.' });
  }
});


app.delete('/laptop/:id_laptop/delete', authenticateToken, async (req, res) => {
  const { id_laptop } = req.params;

  if (!id_laptop) {
    return res.status(400).json({ error: 'Laptop ID is required!' });
  }

  const transaction = await sequelize.transaction();
  try {
    const laptop = await Laptop.findOne({ where: { id_laptop } });
    if (!laptop) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Laptop not found!' });
    }

    await Laptop.destroy(
      { where: { id_laptop } },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({ message: 'Laptop deleted successfully!' });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    return res.status(500).json({ error: 'An error occurred while deleting the laptop.' });
  }
});


app.get('/criteria', async(_, res) => {
  try {
    const criteria = await Criteria.findAll();
    res.json(criteria);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch criteria data' });
  }
});

app.get('/processors', authenticateToken, async (_, res) => {
  const processors = await GenerasiProcessor.findAll();

  const maxIntel = await GenerasiProcessor.max('value', { where: { brand_id: 1 } }); 
  const maxAMD = await GenerasiProcessor.max('value', { where: { brand_id: 2 } });

  const processedData = processors.map(proc => {
    let rescaled_value = proc.value;

    if (proc.brand_id === 2) {
      rescaled_value = ((proc.value - 1) / (maxAMD - 1)) * (maxIntel - 1) + 1;
    }

    return {
      ...proc.toJSON(),
      rescaled_value, 
    };
  });

  res.json(processedData);
});

function createCriteriaRoute(model, route, filterKeys = []) {
  app.get(route, authenticateToken, async (req, res) => {
    try {
      const where = {};

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

createCriteriaRoute(Brand, '/brand'); 
createCriteriaRoute(GenerasiProcessor, '/generasi-processor'); 
createCriteriaRoute(KapasitasRam, '/kapasitas-ram'); 
createCriteriaRoute(KapasitasRom, '/kapasitas-rom'); 
createCriteriaRoute(KecepatanRam, '/kecepatan-ram'); 
createCriteriaRoute(Resolusi, '/resolusi'); 
createCriteriaRoute(TipeProcessor, '/tipe-processor');
createCriteriaRoute(Laptop, '/laptop', ['user_id']);
createCriteriaRoute(Users, '/userinfo');
createCriteriaRoute(NilaiAlternatifLaptop, '/nilai-alternatif-laptop', ['user_id']);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
