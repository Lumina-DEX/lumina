import journal from "./meta/_journal.json"
import m0000 from "./0000_careless_loki.sql"
import m0001 from "./0001_sleepy_vanisher.sql"

export default {
	journal,
	migrations: {
		m0000,
		m0001
	}
}
