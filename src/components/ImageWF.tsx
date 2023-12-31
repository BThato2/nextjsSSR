/* eslint-disable jsx-a11y/alt-text */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { type ImageProps } from "next/image";

type ImagePropsWF = ImageProps;

const ImageWF = (props: ImagePropsWF) => {
  const { src, ...rest } = props;
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      unoptimized
      {...rest}
      src={imgSrc}
      onError={() => {
        setImgSrc("/empty/image.jpg");
      }}
    />
  );
};

export default React.memo(ImageWF);
