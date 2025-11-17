-- Seed data for Aptitude Question Bank
-- Insert sample categories and topics

-- Insert Aptitude Categories
INSERT INTO aptitude_categories (code, name, icon, description, display_order) VALUES
('number-systems', 'Number Systems', '🔢', 'HCF, LCM, divisibility, prime numbers, factors', 1),
('percentages', 'Percentages & Ratios', '📊', 'Percentage calculations, ratio and proportion', 2),
('time-distance', 'Time & Distance', '🚄', 'Speed, time, distance, relative speed, trains, boats', 3),
('profit-loss', 'Profit & Loss', '💰', 'Cost price, selling price, profit, loss, discount', 4),
('simple-compound-interest', 'Interest', '💵', 'Simple interest, compound interest calculations', 5),
('averages', 'Averages', '📈', 'Mean, weighted average, average speed', 6),
('algebra', 'Algebra', '🔤', 'Linear equations, quadratic equations, polynomials', 7),
('geometry', 'Geometry', '📐', 'Triangles, circles, polygons, mensuration', 8),
('data-interpretation', 'Data Interpretation', '📉', 'Tables, graphs, charts, data analysis', 9),
('logical-reasoning', 'Logical Reasoning', '🧠', 'Patterns, sequences, coding-decoding, puzzles', 10);

-- Insert Topics for Number Systems
INSERT INTO aptitude_topics (category_id, code, name, description, display_order)
SELECT id, 'hcf-lcm', 'HCF & LCM', 'Highest Common Factor and Lowest Common Multiple', 1
FROM aptitude_categories WHERE code = 'number-systems'
UNION ALL
SELECT id, 'divisibility', 'Divisibility Rules', 'Rules for divisibility by 2, 3, 4, 5, 6, 7, 8, 9, 10, 11', 2
FROM aptitude_categories WHERE code = 'number-systems'
UNION ALL
SELECT id, 'prime-numbers', 'Prime Numbers', 'Prime numbers, composite numbers, co-primes', 3
FROM aptitude_categories WHERE code = 'number-systems'
UNION ALL
SELECT id, 'factors', 'Factors & Multiples', 'Finding factors, multiples, perfect numbers', 4
FROM aptitude_categories WHERE code = 'number-systems';

-- Insert Topics for Percentages & Ratios
INSERT INTO aptitude_topics (category_id, code, name, description, display_order)
SELECT id, 'percentage-basics', 'Percentage Basics', 'Converting fractions to percentages, basic calculations', 1
FROM aptitude_categories WHERE code = 'percentages'
UNION ALL
SELECT id, 'percentage-change', 'Percentage Change', 'Percentage increase, decrease, successive changes', 2
FROM aptitude_categories WHERE code = 'percentages'
UNION ALL
SELECT id, 'ratios', 'Ratios', 'Ratio, proportion, continued ratio, duplicate ratio', 3
FROM aptitude_categories WHERE code = 'percentages'
UNION ALL
SELECT id, 'mixtures', 'Mixtures & Alligations', 'Mixture problems, alligation method', 4
FROM aptitude_categories WHERE code = 'percentages';

-- Insert Topics for Time & Distance
INSERT INTO aptitude_topics (category_id, code, name, description, display_order)
SELECT id, 'speed-distance', 'Speed & Distance', 'Basic speed, time, distance problems', 1
FROM aptitude_categories WHERE code = 'time-distance'
UNION ALL
SELECT id, 'relative-speed', 'Relative Speed', 'Objects moving in same/opposite directions', 2
FROM aptitude_categories WHERE code = 'time-distance'
UNION ALL
SELECT id, 'trains', 'Trains', 'Train crossing problems, platform, bridge', 3
FROM aptitude_categories WHERE code = 'time-distance'
UNION ALL
SELECT id, 'boats-streams', 'Boats & Streams', 'Upstream, downstream, still water speed', 4
FROM aptitude_categories WHERE code = 'time-distance';

-- Insert Topics for Profit & Loss
INSERT INTO aptitude_topics (category_id, code, name, description, display_order)
SELECT id, 'basic-profit-loss', 'Basic Profit & Loss', 'CP, SP, profit, loss calculations', 1
FROM aptitude_categories WHERE code = 'profit-loss'
UNION ALL
SELECT id, 'discount', 'Discount', 'Marked price, discount, successive discounts', 2
FROM aptitude_categories WHERE code = 'profit-loss'
UNION ALL
SELECT id, 'dishonest-dealings', 'Dishonest Dealings', 'False weights, adulteration', 3
FROM aptitude_categories WHERE code = 'profit-loss';

-- Insert Topics for Interest
INSERT INTO aptitude_topics (category_id, code, name, description, display_order)
SELECT id, 'simple-interest', 'Simple Interest', 'SI = PRT/100, basic calculations', 1
FROM aptitude_categories WHERE code = 'simple-compound-interest'
UNION ALL
SELECT id, 'compound-interest', 'Compound Interest', 'Compound interest calculations, yearly, half-yearly', 2
FROM aptitude_categories WHERE code = 'simple-compound-interest'
UNION ALL
SELECT id, 'ci-applications', 'CI Applications', 'Population growth, depreciation', 3
FROM aptitude_categories WHERE code = 'simple-compound-interest';

-- Insert Topics for Averages
INSERT INTO aptitude_topics (category_id, code, name, description, display_order)
SELECT id, 'basic-average', 'Basic Average', 'Mean, average of numbers', 1
FROM aptitude_categories WHERE code = 'averages'
UNION ALL
SELECT id, 'weighted-average', 'Weighted Average', 'Weighted mean calculations', 2
FROM aptitude_categories WHERE code = 'averages'
UNION ALL
SELECT id, 'average-speed', 'Average Speed', 'Average speed in different scenarios', 3
FROM aptitude_categories WHERE code = 'averages';

-- Insert Topics for Algebra
INSERT INTO aptitude_topics (category_id, code, name, description, display_order)
SELECT id, 'linear-equations', 'Linear Equations', 'Solving linear equations, one variable, two variables', 1
FROM aptitude_categories WHERE code = 'algebra'
UNION ALL
SELECT id, 'quadratic-equations', 'Quadratic Equations', 'ax² + bx + c = 0, roots, factorization', 2
FROM aptitude_categories WHERE code = 'algebra'
UNION ALL
SELECT id, 'polynomials', 'Polynomials', 'Polynomial operations, remainder theorem', 3
FROM aptitude_categories WHERE code = 'algebra';

-- Insert Topics for Geometry
INSERT INTO aptitude_topics (category_id, code, name, description, display_order)
SELECT id, 'triangles', 'Triangles', 'Properties, area, perimeter, Pythagoras theorem', 1
FROM aptitude_categories WHERE code = 'geometry'
UNION ALL
SELECT id, 'circles', 'Circles', 'Circumference, area, arc, sector, chord', 2
FROM aptitude_categories WHERE code = 'geometry'
UNION ALL
SELECT id, 'mensuration', 'Mensuration', 'Area, volume of 2D and 3D shapes', 3
FROM aptitude_categories WHERE code = 'geometry';

-- Insert Topics for Data Interpretation
INSERT INTO aptitude_topics (category_id, code, name, description, display_order)
SELECT id, 'tables', 'Tables', 'Analyzing data from tables', 1
FROM aptitude_categories WHERE code = 'data-interpretation'
UNION ALL
SELECT id, 'bar-charts', 'Bar Charts', 'Reading and interpreting bar graphs', 2
FROM aptitude_categories WHERE code = 'data-interpretation'
UNION ALL
SELECT id, 'pie-charts', 'Pie Charts', 'Pie chart analysis, percentage calculations', 3
FROM aptitude_categories WHERE code = 'data-interpretation'
UNION ALL
SELECT id, 'line-graphs', 'Line Graphs', 'Trend analysis from line graphs', 4
FROM aptitude_categories WHERE code = 'data-interpretation';

-- Insert Topics for Logical Reasoning
INSERT INTO aptitude_topics (category_id, code, name, description, display_order)
SELECT id, 'number-series', 'Number Series', 'Finding patterns in number sequences', 1
FROM aptitude_categories WHERE code = 'logical-reasoning'
UNION ALL
SELECT id, 'coding-decoding', 'Coding-Decoding', 'Letter/number coding patterns', 2
FROM aptitude_categories WHERE code = 'logical-reasoning'
UNION ALL
SELECT id, 'puzzles', 'Puzzles', 'Logical puzzles, seating arrangements', 3
FROM aptitude_categories WHERE code = 'logical-reasoning'
UNION ALL
SELECT id, 'blood-relations', 'Blood Relations', 'Family relationship problems', 4
FROM aptitude_categories WHERE code = 'logical-reasoning';
