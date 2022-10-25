import * as functions from "firebase-functions";
import axios from "axios";
import * as corsModule from "cors";

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

interface GoogleResponse {
table: { rows: { c: [{ v: string }] }[] };
}
const cors = corsModule({origin: true});
exports.fetchFromGoogleSheet = functions.https.onRequest(
    async (request, response) => {
      cors(request, response, async () => {
        request.headers.origin = "https://www.figma.com";
        request.headers["Access-Control-Allow-Origin"] = "*";

        if (request.method === "OPTIONS") {
          // Send response to OPTIONS requests
          response.set("Access-Control-Allow-Methods", "GET");
          response.set("Access-Control-Allow-Headers", "Content-Type");
          response.set("Access-Control-Max-Age", "3600");
          response.status(204).send("");
        }
        const {url = ""} = request.query;

        if (!url) {
          return response.send(
              `URL not valid or missing! 
              could not fetch data! Please provide a valid url`
          );
        }

        try {
          const {data: dataAsText} = await axios.get<string>(String(url), {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "origin": "https://www.figma.com",
            },
          });
          const data: GoogleResponse = JSON.parse(
              dataAsText.substring(47).slice(0, -2)
          );
          functions.logger.debug("this is data ", data);
          const parsedData = data.table.rows
              .reduce<string[]>((finalRows, currentRow) => {
                return [...finalRows, currentRow.c[0].v];
              }, [])
              .filter((i) => i !== "Token name");
          functions.logger.debug("this is parsedData ", parsedData);
          response.set("Access-Control-Allow-Origin", "*");
          response.set("Access-Control-Allow-Credentials", "true");
          response.set("Origin", "https://www.figma.com");
          response.send(parsedData);
          return data;
        } catch (e) {
          functions.logger.error("that's an error! Oops! ", String(e));
          response.status(500).json({error: String(e)});
          return e;
        }
      });
    }
);
