import { host, port } from '../config/constants'
import { LambdaResponseType } from '../types/response-type'
import { createPool } from 'mysql2'
import { databaseName as database } from '../config/constants'
import { jsonResponse } from '../utils/response-utils'
import User from '../types/User'

export const handler = async (event: any): Promise<LambdaResponseType> => {
  if (!event?.body) {
    return jsonResponse(400, 'Missing request body')
  }

  const requestBody = JSON.parse(event.body)

  const user = process.env.USERNAME
  const password = process.env.PASSWORD

  const dbConfig = {
    host,
    port,
    user,
    password,
    database,
  }

  const conn = createPool(dbConfig).promise()

  const query2 = `SELECT Id FROM Scenario WHERE Name = "SQL Injection"`

 

  try {
    const connection = await conn.getConnection()

    const scenarioID = await connection.query(query2)

    const query =
    `INSERT INTO Attempt (Username, ScenarioId, Score, NumberOfQuestions,` +
    `NumberOfAnsweredQuestions, CorrectAnswers, WrongAnswers, HintsUsed, FiftyFiftyUsed) Values("Test",${scenarioID},11,11,11,11,0,0,0)`

    connection.release()

    return jsonResponse(200, JSON.stringify(''))
  } catch (error) {
    return jsonResponse(400, JSON.stringify(error))
  } finally {
    conn.end()
  }
}
