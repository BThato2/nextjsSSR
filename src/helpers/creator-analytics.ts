import axios, { type AxiosResponse } from "axios";

interface CoursePageView {
  date: string;
  views: number;
}

interface CreatorPageView {
  date: string;
  views: number;
}

export const CREATOR_ANALAYTICS_URL =
  process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_URL ?? "";

const coursePagedViewed_analytics = ({
  courseId,
  userId,
  pagePath,
  deviceId,
}: {
  courseId: string;
  userId: string;
  pagePath: string;
  deviceId?: string;
}) => {
  axios
    .post(`${CREATOR_ANALAYTICS_URL}/analytics/course_page_viewed`, {
      courseId: courseId,
      location: "India",
      userId: userId,
      pagePath: pagePath,
      deviceId: deviceId,
    })
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      console.log(err);
    });
};

const courseDetailsChecked_analytics = ({
  courseId,
  userId,
  pagePath,
  deviceId,
}: {
  courseId: string;
  userId: string;
  pagePath: string;
  deviceId?: string;
}) => {
  axios
    .post(`${CREATOR_ANALAYTICS_URL}/analytics/course_details_clicked`, {
      courseId: courseId,
      location: "India",
      userId: userId,
      pagePath: pagePath,
      deviceId: deviceId,
    })
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
};

const courseBuyClicked_analytics = ({
  courseId,
  userId,
  pagePath,
  deviceId,
}: {
  courseId: string;
  userId: string;
  pagePath: string;
  deviceId?: string;
}) => {
  axios
    .post(`${CREATOR_ANALAYTICS_URL}/analytics/course_buy_clicked`, {
      courseId: courseId,
      location: "India",
      userId: userId,
      pagePath: pagePath,
      deviceId: deviceId,
    })
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
};

const creatorProfileViewed_analytics = ({
  creatorId,
  userId,
  deviceId,
}: {
  creatorId: string;
  userId: string;
  deviceId?: string;
}) => {
  axios
    .post(`${CREATOR_ANALAYTICS_URL}/analytics/creator_profile_viewed`, {
      creatorId: creatorId,
      userId: userId,
      deviceId: deviceId,
    })
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
};

const getCoursePageViewed_analytics = async (courseId: string) => {
  try {
    const response: AxiosResponse<CoursePageView[]> = await axios.get(
      `${CREATOR_ANALAYTICS_URL}/analytics/course_page_views?courseId=${courseId}`,
    );
    return response.data;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const getCourseBuyClicks_analytics = async (courseId: string) => {
  try {
    const response: AxiosResponse<number> = await axios.get(
      `${CREATOR_ANALAYTICS_URL}/analytics/course_buy_clicks?courseId=${courseId}`,
    );
    return response.data;
  } catch (err) {
    console.log(err);

    return null;
  }
};

const getCourseDetailsClicks_analytics = async (courseId: string) => {
  try {
    const response: AxiosResponse<number> = await axios.get(
      `${CREATOR_ANALAYTICS_URL}/analytics/course_details_clicks?courseId=${courseId}`,
    );
    return response.data;
  } catch (err) {
    console.log(err);

    return null;
  }
};

const getProfileViewedData_analytics = async ({
  creatorId,
  unique,
}: {
  creatorId: string;
  unique?: boolean;
}) => {
  try {
    const response: AxiosResponse<CreatorPageView[]> = await axios.get(
      `${CREATOR_ANALAYTICS_URL}/analytics/creator_profile_views?creatorId=${creatorId}&unique=${
        unique ? "true" : "false"
      }`,
    );
    return response.data;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getUniqueUserCoursePageViewedData_analytics = async (
  courseId: string,
) => {
  try {
    const response: AxiosResponse<CreatorPageView[]> = await axios.get(
      `${CREATOR_ANALAYTICS_URL}/analytics/course_page_views?courseId=${courseId}&unique=true`,
    );
    return response.data;
  } catch (err) {
    console.log(err);

    return null;
  }
};

const getUniqueUserCourseBuyClickedData_analytics = async (
  courseId: string,
) => {
  try {
    const response: AxiosResponse<number> = await axios.get(
      `${CREATOR_ANALAYTICS_URL}/analytics/course_buy_clicks?courseId=${courseId}&unique=true`,
    );
    return response.data;
  } catch (err) {
    console.log(err);

    return null;
  }
};

const getUniqueUserCourseDetailsClickedData_analytics = async (
  courseId: string,
) => {
  try {
    const response: AxiosResponse<number> = await axios.get(
      `${CREATOR_ANALAYTICS_URL}/analytics/course_details_clicks?courseId=${courseId}&unique=true`,
    );
    return response.data;
  } catch (err) {
    console.log(err);

    return null;
  }
};

const creatorAnalytics = {
  coursePagedViewed_analytics,
  courseDetailsChecked_analytics,
  courseBuyClicked_analytics,
  creatorProfileViewed_analytics,
  getCoursePageViewed_analytics,
  getCourseBuyClicks_analytics,
  getCourseDetailsClicks_analytics,
  getProfileViewedData_analytics,
  getUniqueUserCoursePageViewedData_analytics,
  getUniqueUserCourseBuyClickedData_analytics,
  getUniqueUserCourseDetailsClickedData_analytics,
};
export default creatorAnalytics;
