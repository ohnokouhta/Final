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
                    model_id: "car-train-none-model", 
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
                        askQuestion(res, "好きな車の種類は？", ["フェラーリ", "ポルシェ", "ランボルギーニ", "ベンツ", "レクサス"]);
                    } else if (isTrain) {
                        askQuestion(res, "好きな電車の種類は？", ["京王線", "南武線", "小田急線", "中央線", "千代田線"]);
                    } else {
                        res.send("車か電車の画像を送ってみると、、、");
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
        res.send(`あなたは ${res.json.options[res.json.response]} が好きなんですね。`);
    });
};
