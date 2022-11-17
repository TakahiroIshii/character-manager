import * as AWS from "aws-sdk";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { keyMap, Keys, tableMap } from "../models/tableDecorator";
import { Character, Inventory, Prefix } from "../models/inventory";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const db = new AWS.DynamoDB.DocumentClient();

const tableName = tableMap.get(Inventory)!;
const pk = keyMap.get(Inventory)!.get(Keys.PK)!;
const sk = keyMap.get(Inventory)!.get(Keys.SK)!;

export const handler: APIGatewayProxyHandler = async ({
  httpMethod,
  path,
  pathParameters,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const playerId = pathParameters!["playerId"];
  const characterId = pathParameters!["characterId"];
  const characterDataId = pathParameters!["characterDataId"];

  switch (httpMethod) {
    case "GET": {
      if (path.includes("all")) {
        return getAll(playerId!);
      }
      return get(playerId!, characterId!);
    }
    case "POST": {
      return put(playerId!, characterDataId!);
    }
    default: {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `characters only accept GET/POST method, you tried: ${httpMethod}`,
        }),
      };
    }
  }
};

async function getAll(playerId: Character["player_id"]) {
  const queryParam: DocumentClient.QueryInput = {
    TableName: tableName,
    KeyConditionExpression:
      "#player_id = :player_id and begins_with(#sk, :character_prefix)",
    ExpressionAttributeNames: {
      "#player_id": pk,
      "#sk": sk,
    },
    ExpressionAttributeValues: {
      ":player_id": playerId,
      ":character_prefix": Prefix.character,
    },
  };
  const result = await db.query(queryParam).promise();
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items!),
  };
}

async function get(
  playerId: Character["player_id"],
  characterId: Character["sk"]
) {
  const getParam: DocumentClient.GetItemInput = {
    TableName: tableName,
    Key: {
      [pk]: playerId,
      [sk]: Prefix.character + characterId,
    },
  };
  const result = await db.get(getParam).promise();
  return {
    statusCode: 200,
    body: result.Item!["character_name"],
  };
}

async function put(
  playerId: Character["player_id"],
  characterDataId: Character["character_data_id"]
) {
  const putParams: DocumentClient.PutItemInput = {
    TableName: tableName,
    Item: {
      [pk]: playerId,
      [sk]: Prefix.character + characterDataId,
      character_data_id: characterDataId,
      character_name: "test_character",
      equipped: "none",
    },
  };
  await db.put(putParams).promise();
  return {
    statusCode: 200,
    body: "Done!",
  };
}
