const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const fs = require("fs");

const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
const api_key = "cb2253f7133c4b8abff0aeef0e9fef60";
metadata.set("authorization", "Key " + api_key);

module.exports = (robot) => {
    const onfile = (res, file) => {
        res.download(file, (path) => {
            const imageBytes = fs.readFileSync(path, { encoding: "base64" });
            stub.PostModelOutputs(
                {
                    model_id: "general-image-recognition-model",
                    inputs: [{ data: { image: { base64: imageBytes } } }]
                },
                metadata,
                (err, response) => {
                    if (err) {
                        res.send("Error: " + err);
                        return;
                    }

                    if (response.status.code !== 10000) {
                        res.send("Received failed status: " + response.status.description + "\n" + response.status.details + "\n" + response.status.code);
                        return;
                    }

                    let isCar = false;
                    let isTrain = false;

                    for (const c of response.outputs[0].data.concepts) {
                        if (c.name === "car" && c.value > 0.9) {
                            isCar = true;
                        }
                        if (c.name === "train" && c.value > 0.9) {
                            isTrain = true;
                        }
                    }

                    if (isCar) {
                        askQuestion(res, "好きな車の種類は？", ["SUV", "セダン", "クーペ", "ハッチバック"]);
                    } else if (isTrain) {
                        askQuestion(res, "好きな電車の種類は？", ["新幹線", "通勤電車", "特急", "貨物列車"]);
                    } else {
                        res.send("車や電車が検出されませんでした。");
                    }
                }
            );
        });
    };

    const askQuestion = (res, question, options) => {
        res.send({
            question: question,
            options: options
        });
    };

    robot.respond('file', (res) => {
        onfile(res, res.json);
    });

    robot.respond('select', (res) => {
        res.send(`あなたは ${res.json.options[res.json.response]} が好きなんですね.`);
    });
};
