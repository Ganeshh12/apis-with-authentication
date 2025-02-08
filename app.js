const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')
const bcrypt = require('bcrypt')
let db = null

const initializeDBandServer = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(3000, () => {
      console.log('Server is Running')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}

initializeDBandServer()

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  let query = `SELECT * FROM user WHERE username = '${username}';`
  const doesUserExist = await db.get(query)
  if (doesUserExist !== undefined) {
    response.status(400).send('User already exists')
  } else if (password.length < 5) {
    response.status(400).send('Password is too short')
  } else {
    const hashedPassword = await bcrypt.hash(password, 10)
    //console.log(hashedPassword)
    let query = `INSERT INTO user(username,name,password,gender,location) VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}')`
    await db.run(query)
    response.status(200).send('User created successfully')
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  let query = `SELECT * FROM user WHERE username = '${username}'`
  const doesUserExist = await db.get(query)
  if (doesUserExist === undefined) {
    response.status(400).send('Invalid user')
  } else {
    const doesPasswordMatch = await bcrypt.compare(
      password,
      doesUserExist.password,
    )
    if (!doesPasswordMatch) {
      response.status(400).send('Invalid password')
    } else {
      response.status(200).send('Login success!')
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  let query = `SELECT * FROM user WHERE username = '${username}'`
  const user = await db.get(query)
  const doesPasswordMatch = await bcrypt.compare(oldPassword, user.password)
  if (!doesPasswordMatch) {
    response.status(400).send('Invalid current password')
  } else if (newPassword.length < 5) {
    response.status(400).send('Password is too short')
  } else {
    const newHashedPassword = await bcrypt.hash(newPassword, 10)
    let query = `UPDATE user SET password='${newHashedPassword}' WHERE username = '${username}'`
    await db.run(query)
    response.status(200).send('Password updated')
  }
})

module.exports = app
