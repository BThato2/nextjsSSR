import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

type Props = {
  courseName: string;
  name: string;
  courseId: string;
  creatorProfile: string;
  creatorName: string;
};

export const EnrollmentReportEmail = ({
  courseName,
  name,
  courseId,
  creatorProfile,
  creatorName,
}: Props) => (
  <Tailwind
    config={{
      theme: {
        extend: {
          colors: {
            brand: "#007291",
          },
        },
      },
    }}
  >
    <Html className="w-full">
      <Head />
      <Preview>Thank You for Your Purchase! 🎉</Preview>
      <Body className="w-full" style={main}>
        <Container className="w-full" style={container}>
          <Section className="w-full" style={box}>
            <Img
              src={`https://www.kroto.in/kroto-f.png`}
              width="85"
              height="40"
              alt="Kroto"
              className="mx-auto my-8"
            />
            <Container className="w-full bg-neutral-900 p-4">
              <Text className="mx-auto mb-8 text-center text-4xl">{"🙏"}</Text>
              <Text className="mx-auto text-center text-2xl text-white">
                Thank you for purchasing the course!
              </Text>
            </Container>
            <Container className="px-8 py-2">
              <Text style={paragraph}>
                Dear <span className="font-semibold text-pink-500">{name}</span>
              </Text>
              <Text style={paragraph}>
                I hope this email finds you well and filled with excitement as
                you embark on your learning journey with us! I wanted to
                personally reach out and express my sincere gratitude for
                choosing to purchase {creatorName}{" "}
                <span className="font-semibold text-pink-500 ">
                  {courseName}
                </span>{" "}
                through Kroto.
              </Text>

              <Hr style={hr} />

              <Button
                pX={10}
                pY={10}
                style={button}
                className="cursor-pointer bg-pink-500 hover:bg-pink-600"
                href={`https://www.kroto.in/${creatorProfile}/course/${courseId}`}
              >
                Start Learning!
              </Button>
              <Hr style={hr} />

              <Text style={paragraph}>
                We believe that knowledge is meant to be shared! If you&apos;ve
                found value in our{" "}
                <span className="font-semibold text-pink-500 ">
                  {courseName}
                </span>
                , why not spread the learning joy with your friends and family?
                Simply click the button below to share the course with others
                and inspire them on their learning journey!
              </Text>

              <Hr style={hr} />

              <Text style={paragraph}>
                If you have any queries regarding our services or our platform,
                then reply to this email or get in touch with us on our{" "}
                <Link
                  className="underline-none font-semibold text-pink-500 hover:text-pink-600"
                  href="https://kroto.in/contact-us"
                >
                  contact page
                </Link>
                .
              </Text>
              <Text style={paragraph}>— Rose Kamal Love (CEO @ Kroto)</Text>
            </Container>

            <Container className="w-full p-3 text-neutral-400">
              <Hr style={hr} />
              <Link href="https://kroto.in" className="mx-auto">
                <Img
                  src="https://kroto.in/kroto-logo-p.png"
                  width="35"
                  alt="Kroto"
                  className="mx-auto"
                />
              </Link>

              <Text className="m-0 my-2 p-0 text-center">
                <Link
                  className="mr-4 inline cursor-pointer"
                  href="https://twitter.com/RoseKamalLove1"
                >
                  <Img
                    src="https://kroto.in/twitter-p.png"
                    width="28"
                    alt="Twitter"
                    className="inline"
                  />
                </Link>
                <Link
                  className="inline cursor-pointer"
                  href="https://discord.com/invite/e5SnnVP3ad"
                >
                  <Img
                    src="https://kroto.in/discord-p.png"
                    width="28"
                    alt="Discord"
                    className="inline"
                  />
                </Link>
              </Text>
              <Container className="mx-auto">
                <Text className="m-0 mb-2 p-0 text-center text-sm">
                  Created by
                  <span className="ml-1 font-semibold">Kroto Kreator Labs</span>
                </Text>
                <Text className="m-0 mb-2 p-0 text-center text-xs">
                  <Link
                    className="mx-1 cursor-pointer text-pink-500"
                    href="https://www.kroto.in/info/terms-of-service"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    className="mx-1 cursor-pointer text-pink-500"
                    href="https://www.kroto.in/privacy"
                  >
                    Privacy Policy
                  </Link>
                </Text>
                <Text className="m-0 p-0 text-center text-xs">
                  &copy;2023 Kroto Kreator Labs Pvt. Ltd., All rights reserved.
                </Text>
              </Container>
            </Container>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

export default EnrollmentReportEmail;

EnrollmentReportEmail.defaultProps = {
  courseName: "TypeScript Course",
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  marginBottom: "64px",
};

const box = {};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const paragraph = {
  color: "#525f7f",

  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
};

const button = {
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  width: "100%",
};
