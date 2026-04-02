import { Component, ReactNode } from "react";

export default class Hello extends Component {
    render(): ReactNode {
        return (
            <div className="h-full flex justify-center items-center flex-col gap-10">
                <img src="favicon.ico" className="max-w-[30%]" />
                <p>Hello React!</p>
            </div>
        );
    }
}
