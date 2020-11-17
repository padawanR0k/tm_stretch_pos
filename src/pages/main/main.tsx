import * as React from 'react';
import Layout, { Content } from 'antd/lib/layout/layout';
import PoseDetector from '../../components/features/poseDetector/poseDetector';

interface Props {
}

interface States {
}

class Main extends React.Component<Props, States> {
	constructor(props: Props) {
		super(props);
	}
	componentDidMount() {
	}

	render() {
		return (
			<Layout>
				<Content
					className="site-layout-background"
					style={{
						padding: 24,
						margin: 0,
						minHeight: 280,
					}}>
					<PoseDetector />
				</Content>
			</Layout>
		);
	}

}

export default Main;