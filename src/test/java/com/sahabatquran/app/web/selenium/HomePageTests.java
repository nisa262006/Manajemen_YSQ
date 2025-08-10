package com.sahabatquran.app.web.selenium;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.jdbc.Sql;

import com.sahabatquran.app.web.selenium.pages.HomePage;

@Sql(scripts = {"classpath:/sql/clear-data.sql", "classpath:/sql/base-test-data.sql"})
class HomePageTests extends BaseSeleniumTests {

	@Test
	void testMainPage() {
        HomePage page = new HomePage(webDriver, 
			getHostUrl() + "/", 
			"Sahabat Quran");
        page.checkTitle("Sahabat Quran");
	}
}
