(ns net.littleredcomputer.math.examples.stats-test
  (:require [clojure.test :refer :all]
            [net.littleredcomputer.math.api.stats :as stats]))

(deftest counters
  (let [c1 (stats/make-counter :one)
        c2 (stats/make-counter "two")
        c2b (stats/make-counter "two")]
    (c1) (c2) (c1) (c1) (c1) (c2b) (c2)
    (is (= {:one 4 "two" 3} (stats/get-stats)))))