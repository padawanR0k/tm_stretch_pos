import * as React from 'react';
import neck_top from '../../../assets/images/neck_top.jpg'
import neck_right from '../../../assets/images/neck_right.jpg'
import neck_left from '../../../assets/images/neck_left.jpg'
import neck_bottom from '../../../assets/images/neck_bottom.jpg'
import './style.css'
import Progress from 'antd/lib/progress/progress';

import { Divider, Spin } from 'antd';
import { Header } from './comp/header';
import { Warning } from './comp/warning';

interface Props {
}

interface States {
    classes: {
        [key: string]: any
    },
    current_position: string,
    cam_loaded: boolean,
    is_all_part_showing: boolean,
}

/** */
class PoseDetector extends React.Component<Props, States> {
    URL = {
        model: 'https://teachablemachine.withgoogle.com/models/3ASUymSCy/model.json',
        metadata: 'https://teachablemachine.withgoogle.com/models/3ASUymSCy/metadata.json',
    }
    model?: any // tmPose.CustomPoseNet;
    webcam?: any // tmPose.Webcam;
    /** canvas render context */
    canvas = React.createRef<HTMLCanvasElement>();
    ctx: CanvasRenderingContext2D | null = null;
    maxPredictions: any;

    constructor(props: Props) {
        super(props);
        this.state = {
            classes: {},
            current_position: '',
            cam_loaded: false,
            is_all_part_showing: false
        }
    }
    componentDidMount() {
        this.init()
    }


    /**
     * More API functions here:
     * https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose
     * the link to your model provided by Teachable Machine export panel
     * 캠코더 ON
     * 머신러닝 모델 실행
     */
    init = async () => {
        const modelURL = this.URL.model;
        const metadataURL = this.URL.metadata;
        this.model = await window.tmPose.load(modelURL, metadataURL);
        this.maxPredictions = this.model.getTotalClasses();

        // 웹캠 canvas에 대한 설정
        const width = 300;
        const height = 300;
        const flip = true; // whether to flip the webcam

        this.webcam = new window.tmPose.Webcam(width, height, flip); // width, height, flip
        await this.webcam.setup(); // request access to the webcam
        await this.webcam.play();
        window.requestAnimationFrame(this.loop);

        // append/get elements to the DOM
        if (this.canvas.current) {
            this.canvas.current.width = width;
            this.canvas.current.height = height;
            this.ctx = this.canvas.current.getContext("2d");
        }
    }

    loop = async (timestamp: number) => {
        if (!this.state.cam_loaded) {
            this.setState({ cam_loaded: true })
        }
        if (this.webcam) {
            this.webcam.update(); // update the webcam frame
        }
        await this.predict();
        window.requestAnimationFrame(this.loop);
    }

    predict = async () => {
        // posnet을 통해 인풋을 받는다. (estimatePose는 이미지, 비디오, canvas html element로 인풋을 받을 수 있다.)
        try {
            if (!this.webcam) {
                throw ('웹캠이 로드되지 않았습니다.')
            } else if (!this.model) {
                throw ('모델이 로드되지 않았습니다.')
            } else {
                const { pose, posenetOutput } = await this.model.estimatePose(this.webcam.canvas);
                // classfication 모델에 input을 넣어 실행시킨다.
                const prediction = await this.model.predict(posenetOutput);

                let current_position = '';
                const classes = prediction.reduce((acc: any, curr: any) => {
                    acc[curr.className] = Number(curr.probability.toFixed(2))
                    if (acc[curr.className] === 1) {
                        current_position = curr.className
                    }
                    return acc;
                }, {} as any)

                if (this.state.current_position === '' || this.state.current_position !== current_position) {
                    this.setState({
                        classes,
                        current_position
                    })
                    console.timeStamp()
                }

                this.drawPose(pose);
            }
        } catch (error) {
        }

    }

    drawPose = (pose: any) => {
        if (!this.webcam) {
            alert('웹캠이 존재하지 않습니다.')
        } else if (this.webcam.canvas) {
            if (this.ctx) {
                this.ctx.drawImage(this.webcam.canvas, 0, 0);
                // { score: 0.9964627623558044, part: "nose", position: { … } }
                // 1: { score: 0.9983192682266235, part: "leftEye", position: { … } }
                // 2: { score: 0.9983325600624084, part: "rightEye", position: { … } }
                // 3: { score: 0.7143639326095581, part: "leftEar", position: { … } }
                // 4: { score: 0.9661445617675781, part: "rightEar", position: { … } }
                // 5: { score: 0.9714065790176392, part: "leftShoulder", position: { … } }
                // 6: { score: 0.7849381566047668, part: "rightShoulder", position: { … } }
                // 7: { score: 0.040635090321302414, part: "leftElbow", position: { … } }
                // 8: { score: 0.061596691608428955, part: "rightElbow", position: { … } }
                if (pose) {
                    const minPartConfidence = 0.5;
                    window.tmPose.drawKeypoints(pose.keypoints, minPartConfidence, this.ctx);
                    window.tmPose.drawSkeleton(pose.keypoints, minPartConfidence, this.ctx);
                }

                const is_all_part_showing = this.check_parts(pose.keypoints);
                if (is_all_part_showing !== this.state.is_all_part_showing) {
                    this.setState({
                        is_all_part_showing
                    })
                }
            }
        }
    }

    /**
     * 머리와 어깨가 화면에 보여지고 있는지 여부
     * @param keypoints
     */
    check_parts = (keypoints: Required<{part: string, score: number}>[]) => {
        const REQUIRE_PARTS = ["leftEye", "rightEye", "leftEar", "rightEar", "leftShoulder", "rightShoulder"];

        return keypoints.every(item => {
            if (REQUIRE_PARTS.indexOf(item.part) === -1) {
                return true
            } else {
                return item.score > 0.1
            }
        })
    }

    render() {
        const { classes, is_all_part_showing, cam_loaded } = this.state

        const class_with_img: any = {
            neck_strecth_top: neck_top,
            neck_strecth_right: neck_right,
            neck_strecth_left: neck_left,
            neck_strecth_down: neck_bottom,
        }

        return (
            <div id="container">
                <section className="PoseDetector">
                    <Header />

                    <section className="cam">

                        <canvas ref={this.canvas} id="canvas" />

                        {
                            is_all_part_showing || !cam_loaded
                            ? null
                            :
                            <Warning />
                        }

                        {
                            !cam_loaded
                                ? <div className="spinner"> <Spin size="large" > </Spin></div>
                                : null
                        }
                    </section>

                    <Divider />

                    <section className="imgs">
                        {Object.keys(classes).map((key, index, arr) => {
                            return (
                                class_with_img[key] &&
                                <div className={"imgs__container " + (classes[key] === 1 ? 'active' : '')} key={index}>
                                    <img
                                        className="imgs__img"
                                        src={class_with_img[key]}
                                        alt="출처: http://www.seouldailynews.co.kr/coding/news.aspx/18/1/8347" />
                                    <Progress percent={classes[key] * 100} type="line" />
                                </div>)
                        })}
                    </section>
                </section>
            </div>
        );
    }

}

export default PoseDetector;

