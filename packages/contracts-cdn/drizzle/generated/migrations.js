import journal from "./meta/_journal.json"
import m0000 from "./0000_careless_loki.sql"
import m0001 from "./0001_sleepy_vanisher.sql"
import m0002 from "./0002_strange_silver_samurai.sql"
import m0003 from "./0003_wonderful_typhoid_mary.sql"

export default {
	journal,
	migrations: {
		m0000,
		m0001,
		m0002,
		m0003
	}
}
